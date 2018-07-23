const semver = require('semver');
const pkg = require(process.cwd() + '/package.json');

const dependencyKeys = ['dependencies', 'peerDependencies', 'devDependencies'];
let hasReact;
dependencyKeys.forEach(key => {
  if (pkg[key] && pkg[key].react) {
    hasReact = true;
    // v16 is less than the given range then this app is v16 compatible
    if (!semver.gtr('16.0.0', pkg[key].react)) {
      console.error('This repo already has React 16 compatibility');
      process.exit(1);
    }
  }
});

if (!hasReact) {
  console.error('This repo does not use React');
  process.exit(1);
}
