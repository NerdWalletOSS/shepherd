import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';

describe('CLI End-to-End Tests', () => {
  let shepherdRepoDir: string;

  beforeAll(() => {
    shepherdRepoDir = path.resolve(
      os.homedir(),
      '.shepherd',
      '2024.10.06-test-migration',
      'repos',
      'NerdWalletOSS',
      'shepherd'
    );
  });

  afterAll(() => {
    const testMigrationDir = path.resolve(os.homedir(), '.shepherd', '2024.10.06-test-migration');
    fs.rmSync(testMigrationDir, { recursive: true });
  });

  const cliPath = path.resolve(__dirname, '../lib/cli.js');

  const runCLI = (args: string) => {
    return execSync(`node ${cliPath} ${args}`, { encoding: 'utf-8' });
  };

  it('should display help information', async () => {
    const output = runCLI('--help');
    expect(output).toMatchSnapshot();
  });

  it('should display version information', async () => {
    const output = runCLI('version');
    expect(output.split('.').length).toEqual(3);
  });

  it('should successfully run checkout on a migration targeting a single repo', async () => {
    const output = runCLI(`checkout ${path.join(__dirname, './assets/checkout-apply')}`);
    expect(output).toMatchSnapshot();
  });

  it('should successfully run checkout on a migration targeting multiple repos', async () => {
    const output = runCLI(
      `checkout ${path.join(__dirname, './assets/checkout-apply')} --repos="aorinevo/shepherd-test-repo-1,aorinevo/shepherd-test-repo-2"`
    );
    expect(output).toContain('shepherd-test-repo-1');
    expect(output).toContain('shepherd-test-repo-2');
  });

  it('should successfully run apply on a migration', async () => {
    const output = runCLI(`apply ${path.join(__dirname, './assets/checkout-apply')}`);
    expect(output).toContain('shepherd-test-repo-1');
    expect(output).toContain('shepherd-test-repo-2');
    expect(output).toContain('NerdWalletOSS/shepherd');
    const repoDir = path.resolve(shepherdRepoDir, '../../aorinevo/shepherd-test-repo-1');
    const gitDiffOutput = execSync(`cd ${repoDir} && git diff`, { encoding: 'utf-8' });
    expect(gitDiffOutput).toMatchSnapshot();
  });
});
