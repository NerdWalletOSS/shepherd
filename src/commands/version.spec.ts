import fs from 'fs-extra';
import path from 'path';
import version from './version';

describe('reposEqual', () => {
  it('recognizes two repos as equal', async () => {
    const pack = await fs.readFile(path.resolve(__dirname, '../../package.json'), 'utf8');
    const { version: vers } = JSON.parse(pack);
    expect(await version()).toBe(vers);
  });
});
