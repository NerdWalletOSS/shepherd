import { spawn } from 'child-process-promise';
import { IRepo } from '../adapters/base.js';
import { IMigrationContext } from '../migration-context.js';

export default async (context: IMigrationContext, repo: IRepo, command: string): Promise<any> => {
  const repoDir = context.adapter.getRepoDir(repo);
  const dataDir = context.adapter.getDataDir(repo);
  const baseBranch = context.adapter.getBaseBranch(repo);
  const migrationDir = context.migration.migrationDirectory;
  const adapterEnvironmentVars = await context.adapter.getEnvironmentVariables(repo);

  const execOptions = {
    cwd: repoDir,
    env: {
      ...process.env,
      SHEPHERD_REPO_DIR: repoDir,
      SHEPHERD_DATA_DIR: dataDir,
      SHEPHERD_MIGRATION_DIR: migrationDir,
      SHEPHERD_BASE_BRANCH: baseBranch,
      ...adapterEnvironmentVars,
    },
    shell: true,
    capture: ['stdout', 'stderr'],
  };
  return spawn(command, [], execOptions);
};
