import fs from 'fs';
import yaml from 'js-yaml';
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
  adapter: string;
  search_query: string;
  hooks: IMigrationHooks;
}

export function loadSpec(directory: string): IMigrationSpec {
  const docPath = path.join(directory, 'shepherd.yml');
  const doc = yaml.safeLoad(fs.readFileSync(docPath, 'utf8'));
  if (doc.hooks) {
    PHASES.forEach((phase) => {
      if (!(phase in doc.hooks)) { return; }
      if (typeof doc.hooks[phase] === 'string') {
        // We'll normalize the spec so that all phases are arrays of steps
        doc.hooks[phase] = [doc.hooks[phase]];
      } else if (!Array.isArray(doc.hooks[phase])) {
        throw new Error(`Error reading shepherd.yml: ${phase} must be a string or array`);
      }
    });
  } else {
    doc.hooks = {};
  }
  return doc;
}
