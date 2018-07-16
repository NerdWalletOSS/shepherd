const yaml = require('js-yaml');
const path = require('path');
const fs = require('fs');

const PHASES = [
  'should_migrate',
  'post_checkout',
  'apply',
  'pr_message',
];

module.exports.loadSpec = (directory) => {
  const docPath = path.join(directory, 'shepherd.yml');
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
