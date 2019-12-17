import { ChildProcessPromise, spawn } from 'child-process-promise';
import { ChildProcess } from 'child_process';
import { IEnvironmentVariables } from '../adapters/base';
import { IMigrationContext } from '../migration-context';

interface IExecRepoResult {
  promise: ChildProcessPromise;
  childProcess: ChildProcess;
}

export default async (
  context: IMigrationContext,
  command: string,
  additionalEnvironmentVariables: IEnvironmentVariables
): Promise<IExecRepoResult> => {
  const migrationDir = context.migration.migrationDirectory;

  const execOptions = {
    cwd: migrationDir,
    env: {
      ...process.env,
      SHEPHERD_MIGRATION_DIR: migrationDir,
      ...additionalEnvironmentVariables,
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
