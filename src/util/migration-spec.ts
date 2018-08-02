import fs from 'fs';
import Joi from 'joi';
import yaml from 'js-yaml';
import { cloneDeep, mapValues } from 'lodash';
import path from 'path';

const PHASES = [
  'should_migrate',
  'post_checkout',
  'apply',
  'pr_message',
];

export interface IMigrationHooks {
  should_migrate?: string[];
  post_checkout?: string[];
  apply?: string[];
  pr_message?: string[];
  [name: string]: string[] | undefined;
}

export type MigrationPhase = [keyof IMigrationHooks];

export interface IMigrationSpec {
  id: string;
  title: string;
  adapter: {
    type: string;
    [key: string]: any;
  };
  hooks: IMigrationHooks;
}

export function loadSpec(directory: string): IMigrationSpec {
  const docPath = path.join(directory, 'shepherd.yml');
  const spec = yaml.safeLoad(fs.readFileSync(docPath, 'utf8'));
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
  const schema = Joi.object().keys({
    id: Joi.string().required(),
    title: Joi.string().required(),
    adapter: Joi.object().keys({
      type: Joi.string().allow(['github']).required(),
    }).unknown(true).required(),
    hooks: Joi.object().keys({
      should_migrate: hookSchema,
      post_checkout: hookSchema,
      apply: hookSchema,
      pr_message: hookSchema,
    }),
  });
  return Joi.validate(spec, schema);
}
