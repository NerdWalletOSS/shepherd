import Joi from 'joi';
import fs from 'fs';
import * as yaml from 'js-yaml';
import _ from 'lodash';
const { cloneDeep, mapValues } = _;
import path from 'path';

export interface IMigrationHooks {
  should_migrate?: string[];
  post_checkout?: string[];
  apply?: string[];
  pr_message?: string[];
  [name: string]: string[] | undefined;
}

export interface IMigrationIssues {
  title: string | number;
  description?: string;
  labels?: string[];
  state?: string;
  state_reason?: string;
}

const state = ['open', 'closed'];

const state_reason = ['completed', 'not_planned', 'reopened'];

export type MigrationPhase = [keyof IMigrationHooks];

export interface IMigrationSpec {
  id: string;
  title: string;
  adapter: {
    type: string;
    [key: string]: any;
  };
  hooks: IMigrationHooks;
  issues?: IMigrationIssues;
}

export function loadSpec(directory: string): IMigrationSpec {
  const docPath = path.join(directory, 'shepherd.yml');
  const spec = yaml.load(fs.readFileSync(docPath, 'utf8'));
  const normalizedSpec = normalizeSpec(spec);
  const validationResult = validateSpec(normalizedSpec);
  if (validationResult.error) {
    throw new Error(`Error loading migration spec: ${validationResult.error.message}`);
  }
  return normalizedSpec;
}

export function normalizeSpec(originalSpec: any): IMigrationSpec {
  const spec = cloneDeep(originalSpec);
  if (spec.hooks) {
    spec.hooks = mapValues(spec.hooks, (steps: any, phase: string) => {
      if (typeof steps === 'string') {
        return [steps];
      } else if (Array.isArray(steps)) {
        return steps;
      } else {
        throw new Error(`Error reading shepherd.yml: ${phase} must be a string or array`);
      }
    });
  } else {
    spec.hooks = {};
  }
  return spec;
}

export function validateSpec(spec: any) {
  const hookSchema = Joi.array().items(Joi.string());
  const schema = Joi.object({
    id: Joi.string().required(),
    title: Joi.string().required(),
    adapter: Joi.object({
      type: Joi.string().valid('github').required(),
    })
      .unknown(true)
      .required(),
    hooks: Joi.object({
      should_migrate: hookSchema,
      post_checkout: hookSchema,
      apply: hookSchema,
      pr_message: hookSchema,
    }),
    issues: Joi.object({
      title: Joi.any().required(),
      description: Joi.string().required(),
      state: Joi.string()
        .valid(...state)
        .optional(),
      state_reason: Joi.string()
        .valid(...state_reason)
        .optional(),
      labels: hookSchema.optional(),
    }),
  });

  return schema.validate(spec);
}
