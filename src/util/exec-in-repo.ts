import { exec } from 'child-process-promise';
import BaseAdapter, { IRepo } from '../adapters/base';

export default async (adapter: BaseAdapter, repo: IRepo, command: string) => {
  const repoDir = await adapter.getRepoDir(repo);
  const dataDir = await adapter.getDataDir(repo);
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
