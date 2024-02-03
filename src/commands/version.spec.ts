import fs from 'fs-extra';
import path from 'path';
import version from './version.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('reposEqual', () => {
  it('recognizes two repos as equal', async () => {
    const pack = await fs.readFile(path.resolve(__dirname, '../../package.json'), 'utf8');
    const { version: vers } = JSON.parse(pack);
    expect(await version()).toBe(vers);
  });
});
