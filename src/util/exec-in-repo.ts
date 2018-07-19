import { ChildProcessPromise, spawn } from 'child-process-promise';
import { ChildProcess } from 'child_process';
import BaseAdapter, { IRepo } from '../adapters/base';
import { IMigrationContext } from '../migration-context';

interface IExecRepoResult {
  promise: ChildProcessPromise;
  childProcess: ChildProcess;
}

export default async (context: IMigrationContext, repo: IRepo, command: string): Promise<IExecRepoResult> => {
  const repoDir = await context.adapter.getRepoDir(repo);
  const dataDir = await context.adapter.getDataDir(repo);
  const migrationDir = context.migration.migrationDirectory;
  const execOptions = {
    cwd: repoDir,
    env: {
      ...process.env,
      REPO_DIR: repoDir,
      DATA_DIR: dataDir,
      MIGRATION_DIR: migrationDir,
    },
    shell: true,
    capture: [ 'stdout', 'stderr' ],
  };
  const promise = spawn(command, [], execOptions) as ChildProcessPromise;
  return {
    promise,
    childProcess: promise.childProcess,
  };
};
