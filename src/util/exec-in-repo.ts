import { ChildProcessPromise, spawn } from 'child-process-promise';
import { ChildProcess } from 'child_process';
import BaseAdapter, { IRepo } from '../adapters/base';

interface IExecRepoResult {
  promise: Promise<ChildProcess>;
  childProcess: ChildProcess;
}

export default async (adapter: BaseAdapter, repo: IRepo, command: string): Promise<IExecRepoResult> => {
  const repoDir = await adapter.getRepoDir(repo);
  const dataDir = await adapter.getDataDir(repo);
  const execOptions = {
    cwd: repoDir,
    env: {
      ...process.env,
      REPO_DIR: repoDir,
      DATA_DIR: dataDir,
    },
    shell: true,
  };
  const promise = spawn(command, [], execOptions) as ChildProcessPromise;
  return {
    promise,
    childProcess: promise.childProcess,
  };
};
