const fs = require('fs');
const cp = require('child_process');

let isLibrary = false;
// Indy backed library
if (fs.existsSync(process.cwd() + '/Jenkinsfile') && !fs.existsSync(process.cwd() + '/app.yml')) {
  isLibrary = true;
} else if (fs.existsSync(process.cwd() + '/publish.sh')) {
  // mrjenkins backed library
  isLibrary = true;
}

const cmd = `${__dirname}/node_modules/.bin/nw-react react@16 --interactive=false ${
  isLibrary ? '--library' : ''
}`;
cp.execSync(cmd, { stdio: 'inherit' });
