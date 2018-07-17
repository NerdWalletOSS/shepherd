import { exec } from 'child-process-promise';
import BaseAdapter, { IRepo } from '../adapters/base';

export default async (adapter: BaseAdapter, repo: IRepo, command: string) => {
  const repoDir: string = await adapter.getRepoDir(repo);
  const dataDir: string = await adapter.getDataDir(repo);
  const execOptions = {
    cwd: repoDir,
    env: {
      ...process.env,
      REPO_DIR: repoDir,
      DATA_DIR: dataDir,
    },
  };
  await exec(command, execOptions);
};
