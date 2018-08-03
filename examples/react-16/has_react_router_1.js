const semver = require('semver');
const fs = require('fs');

// Read package.json
const packageJsonPath = process.argv[2];
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath));

// Check react-router version
const deps = packageJson.dependencies;
const reactRouterVersion = deps && deps['react-router']
const isVersionOne = semver.intersects('^1', reactRouterVersion);

// Exit zero only if react-router@1 exists
if (isVersionOne) {
  process.exit(0);
} else {
  process.exit(1);
}
