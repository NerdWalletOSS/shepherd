import fs from 'fs-extra';
import path from 'path';

export default async ()=>{
    const pack = await fs.readFile(path.resolve(__dirname, '../../package.json'),'utf8');
    const {version} = JSON.parse(pack);
    return version;
}