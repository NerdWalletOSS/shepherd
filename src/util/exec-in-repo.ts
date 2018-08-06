import { ChildProcessPromise, spawn } from 'child-process-promise';
import { ChildProcess } from 'child_process';
import { IRepo } from '../adapters/base';
import { IMigrationContext } from '../migration-context';

interface IExecRepoResult {
  promise: ChildProcessPromise;
  childProcess: ChildProcess;
}

export default (context: IMigrationContext, repo: IRepo, command: string): IExecRepoResult => {
  const repoDir = context.adapter.getRepoDir(repo);
  const dataDir = context.adapter.getDataDir(repo);
  const migrationDir = context.migration.migrationDirectory;
  const execOptions = {
    cwd: repoDir,
    env: {
      ...process.env,
      SHEPHERD_REPO_DIR: repoDir,
      SHEPHERD_DATA_DIR: dataDir,
      SHEPHERD_MIGRATION_DIR: migrationDir,
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
