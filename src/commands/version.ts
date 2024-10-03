import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async () => {
  const pack = await fs.readFile(path.resolve(__dirname, '../../package.json'), 'utf8');
  const { version } = JSON.parse(pack);
  return version;
};
