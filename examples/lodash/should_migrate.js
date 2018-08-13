const semver = require('semver');
const path = require('path');
const fs = require('fs');

const pkg = require(path.join(process.cwd(), 'package.json'));

const version3deps = [];
const version4deps = [];
const dependencies = pkg['dependencies'];
if (dependencies) {
  Object.keys(dependencies).forEach(pkgName => {
    if (pkgName === 'lodash' || pkgName.startsWith('lodash.')) {
      const version = dependencies[pkgName];
      if (semver.ltr('3.999.999', version)) {
        // We're on v4 already
        version4deps.push(pkgName);
      } else if (semver.ltr('2.999.999', version)) {
        version3deps.push(pkgName);
      } else {
        throw new Error(`Unknown package version: ${pkgName} ${version}`);
      }
    }
  })
}

if (!version3deps.length && !version4deps.length) {
  console.error('This repo does not depend on Lodash');
  process.exit(1);
}

if (version3deps.length && version4deps.length) {
  console.error('Cannot handle mix of dependency versions');
  console.error('[version 3]');
  version3deps.map(d => console.error(d));
  console.error('[version 4]');
  version4deps.map(d => console.error(d));
  process.exit(1);
}

if (!version3deps.length && version4deps.length) {
  console.error('Repo already uses Lodash 4');
  process.exit(1);
}

// Nice, we actually depend on Lodash. Save these lists for later.
const dataDir = process.env.SHEPHERD_DATA_DIR;
fs.writeFileSync(path.join(dataDir, 'v3deps.json'), JSON.stringify(version3deps, undefined, 2));
fs.writeFileSync(path.join(dataDir, 'v4deps.json'), JSON.stringify(version4deps, undefined, 2));
