import chalk from 'chalk';
import IRepoAdapter, { IRepo } from '../adapters/base.js';
import { IMigrationContext } from '../migration-context.js';
import executeSteps from '../util/execute-steps.js';
import forEachRepo from '../util/for-each-repo.js';

async function resetRepo(
  context: IMigrationContext,
  repo: any,
  repoLogs: string[]
): Promise<boolean> {
  const { adapter } = context;
  try {
    await adapter.resetChangedFiles(repo);
    repoLogs.push('Successfully reset repo');
    return true;
  } catch (e: any) {
    repoLogs.push('Failed to remove changes; not applying migration');
    return false;
  }
}

async function resetBranch(
  context: IMigrationContext,
  repo: any,
  options: any,
  repoLogs: string[]
): Promise<boolean> {
  const { adapter, logger } = context;
  if (options.skipResetBranch) {
    repoLogs.push('Not resetting branch');
    return true;
  }
  try {
    await adapter.resetRepoBeforeApply(repo, options.forceResetBranch);
    repoLogs.push('Successfully reset branch');
    return true;
  } catch (e: any) {
    logger.error(e);
    repoLogs.push('Failed to reset branch; not applying migration');
    return false;
  }
}

async function handleApplySteps(
  context: IMigrationContext,
  repo: any,
  options: any,
  repoLogs: string[]
): Promise<boolean> {
  const { logger, adapter } = context;
  repoLogs.push('Running apply steps');
  const stepsResults = await executeSteps(context, repo, 'apply', true, repoLogs);
  if (stepsResults.succeeded) {
    repoLogs.push('Completed all apply steps successfully');
    return true;
  }

  logger.error('> Failed to run all apply steps');
  repoLogs.push('> Failed to run all apply steps');
  if (options.skipResetOnError) {
    logger.info('Not resetting repo');
    repoLogs.push('Not resetting repo');
    return false;
  }

  try {
    await adapter.resetChangedFiles(repo);
    repoLogs.push('Successfully reset repo');
  } catch (e: any) {
    logger.error(e);
    repoLogs.push('Failed to reset repo');
  }
  return false;
}

const logRepoInfo = (
  repo: IRepo,
  count: number,
  total: number,
  adapter: IRepoAdapter,
  repoLogs: string[]
): void => {
  const indexString = chalk.dim(`${count}/${total}`);
  repoLogs.push(chalk.bold(`\n[${adapter.stringifyRepo(repo)}] ${indexString}`));
};

/**
 * Applies migration steps to each repository in the given context.
 *
 * @param context - The migration context containing repositories to be processed.
 * @param options - Additional options to customize the migration process.
 * @returns A promise that resolves when all repositories have been processed.
 */
export default async (context: IMigrationContext, options: any): Promise<void> => {
  const { adapter, logger, migration } = context;
  const repos = migration.repos || [];
  let count = 1;
  await forEachRepo(context, async (repo) => {
    const repoLogs: string[] = [];
    logRepoInfo(repo, count++, repos.length, adapter, repoLogs);
    if (!(await resetRepo(context, repo, repoLogs))) return;
    if (!(await resetBranch(context, repo, options, repoLogs))) return;
    await handleApplySteps(context, repo, options, repoLogs);
    repoLogs.forEach((log) => logger.info(log));
  });
};
