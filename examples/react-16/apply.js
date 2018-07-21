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

const cmd = `npx @nerdwallet/nw-react react@16 --interactive=false --install=false ${
  isLibrary ? '--library' : ''
}`;
cp.execSync(cmd, { stdio: 'inherit' });
