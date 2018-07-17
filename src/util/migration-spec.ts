import fs from 'fs';
import yaml from 'js-yaml';
import path from 'path';

const PHASES = [
  'should_migrate',
  'post_checkout',
  'apply',
  'pr_message',
];

export interface IMigrationSpec {
  name: string;
  adapter: string;
  search_query: string;
  should_migrate: string[];
  post_checkout: string[];
  apply: string[];
  pr_message: string;

}

export function loadSpec(directory: string): IMigrationSpec {
  const docPath: string = path.join(directory, 'shepherd.yml');
  const doc = yaml.safeLoad(fs.readFileSync(docPath, 'utf8'));
  PHASES.forEach((phase) => {
    if (!(phase in doc)) { return; }
    if (typeof doc[phase] === 'string') {
      // We'll normalize the spec so that all phases are arrays of steps
      doc[phase] = [doc[phase]];
    } else if (!Array.isArray(doc[phase])) {
      throw new Error(`Error reading shepherd.yml: ${phase} must be a string or array`);
    }
  });
  return doc;
}
