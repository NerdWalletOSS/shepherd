import yaml from 'js-yaml';
import path from 'path';
import fs from 'fs';

const PHASES = [
  'should_migrate',
  'post_checkout',
  'apply',
  'pr_message',
];

export interface MigrationSpec {
  name: string,
  adapter: string,
  search_query: string,
  should_migrate: Array<string>,
  post_checkout: Array<string>,
  apply: Array<string>,
  pr_message: string,
  
}

export function loadSpec(directory: string): MigrationSpec {
  const docPath: string = path.join(directory, 'shepherd.yml');
  const doc = yaml.safeLoad(fs.readFileSync(docPath, 'utf8'));
  PHASES.forEach((phase) => {
    if (!(phase in doc)) return;
    if (typeof doc[phase] === 'string') {
      // We'll normalize the spec so that all phases are arrays of steps
      doc[phase] = [doc[phase]];
    } else if (!Array.isArray(doc[phase])) {
      throw new Error(`Error reading shepherd.yml: ${phase} must be a string or array`);
    }
  });
  return doc;
};
