const fs = require('fs');
const semver = require('semver');
const sortPackageJson = require('sort-package-json');
const cp = require('child_process');
const Jenkinsfile = `#!groovy

indy {
     base = 'ubuntu-2017.05.23'
}
`;
const pkg = require(process.cwd() + '/package.json');
const version = semver.inc(semver.coerce(pkg.version), 'minor');

const CHANGELOG = `# ${version}
* Migrate to Indy
`;
delete pkg.version;

fs.unlinkSync('publish.sh');
fs.writeFileSync('Jenkinsfile', Jenkinsfile);
fs.writeFileSync('package.json', JSON.stringify(sortPackageJson(pkg), null, 2));
fs.writeFileSync('VERSION', version + '\n');
cp.execSync('npm uninstall npe', { stdio: 'inherit' });
