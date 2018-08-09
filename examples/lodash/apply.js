const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Load list of deps from checkout phase
const dataDir = process.env.SHEPHERD_DATA_DIR;
const v3deps = JSON.parse(fs.readFileSync(path.join(dataDir, 'v3deps.json'), 'utf8'));
const v4deps = JSON.parse(fs.readFileSync(path.join(dataDir, 'v4deps.json'), 'utf8'));

// Only one of them will be non-empty anyways
const deps = v3deps.length ? v3deps : v4deps;

// To make things easy (and to ensure we resolve imports + jscodeshift)
// we'll switch to the migration dir and execute the transform on the repo directory
process.chdir(process.env.SHEPHERD_MIGRATION_DIR);

const runCodemod = (codemodPath) => {
  // We need to use babylon for modern syntax like decorators
  const cmd = `npx jscodeshift --extensions js,jsx --ignore-pattern "node_modules" --parser babylon --transform ${codemodPath} ${process.env.SHEPHERD_REPO_DIR}`;
  console.log(`$ ${cmd}`);
  execSync(cmd, { stdio: 'inherit' });
}
const runLodashCodemod = (name) => runCodemod(path.join('node_modules', 'lodash-codemods', 'lib', name));

if (deps.some(d => d.startsWith('lodash.'))) {
  // We need to transform the lodash.* style imports first
  runCodemod('codemods/npm-codemod.js');
}

runCodemod('codemods/use-underscore-import.js');

if (v3deps.length) {
  // We need to run the v3 -> v4 codemods
  const lodashCodemods = [
    'by-iteratee-with-one-param.js',
    'method-calls-conditional-name-changes.js',
    'method-name-changes.js',
    'remove-category-from-import.js',
    'this-arg-removal.js',
  ]
  lodashCodemods.forEach(codemod => runLodashCodemod(codemod));
}

runCodemod('codemods/use-path-import.js');

// We can now uninstall any `lodash.*` packages; we'll install the latest lodash later
process.chdir(process.env.SHEPHERD_REPO_DIR);
execSync(`npm uninstall ${deps.join(' ')}`, { stdio: 'inherit' });