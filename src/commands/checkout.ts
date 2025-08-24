import fs from 'fs-extra';
import IRepoAdapter, { IRepo } from '../adapters/base.js';
import { IMigrationContext } from '../migration-context.js';
import executeSteps from '../util/execute-steps.js';
import { updateRepoList } from '../util/persisted-data.js';
import forEachRepo from '../util/for-each-repo.js';
import chalk from 'chalk';

const removeRepoDirectories = async (adapter: IRepoAdapter, repo: IRepo) => {
  await fs.remove(adapter.getRepoDir(repo));
  await fs.remove(adapter.getDataDir(repo));
};

const loadRepos = async (
  context: IMigrationContext,
  onRetry: (numSeconds: number) => void
): Promise<IRepo[]> => {
  const {
    migration: { selectedRepos },
    adapter,
    logger,
  } = context;
  if (selectedRepos) {
    logger.info(`Using ${selectedRepos.length} selected repos`);
    return selectedRepos;
  } else {
    logger.info('Loading candidate repos');
    const repos = (await adapter.getCandidateRepos(onRetry)) || [];
    logger.info(`Loaded ${repos.length} repos`);
    return repos;
  }
};

/**
 * Handles the checkout process for a given repository.
 *
 * @param context - The migration context containing the adapter and logger.
 * @param repo - The repository to be checked out.
 * @param checkedOutRepos - An array to store successfully checked out repositories.
 * @param discardedRepos - An array to store repositories that were discarded during the process.
 * @param repoLogs - An array to store log messages related to the checkout process.
 *
 * @returns A promise that resolves when the checkout process is complete.
 *
 * @throws Will log an error and skip the repository if the checkout process fails.
 *
 * The function performs the following steps:
 * 1. Attempts to check out the repository using the adapter.
 * 2. Creates necessary directories for the repository.
 * 3. Runs the 'should_migrate' steps and discards the repository if they fail.
 * 4. Runs the 'post_checkout' steps and discards the repository if they fail.
 * 5. Adds the repository to the checkedOutRepos array if all steps succeed.
 */
export const handleRepoCheckout = async (
  context: IMigrationContext,
  repo: IRepo,
  checkedOutRepos: IRepo[],
  discardedRepos: IRepo[],
  repoLogs: string[]
) => {
  const { adapter, logger } = context;
  try {
    await adapter.checkoutRepo(repo);
    repoLogs.push('Checked out repo');
  } catch (e: any) {
    logger.error(e);
    repoLogs.push('Failed to check out repo; skipping');
    return;
  }

  await fs.mkdirs(adapter.getDataDir(repo));

  repoLogs.push('> Running should_migrate steps');
  const shouldMigrateResults = await executeSteps(context, repo, 'should_migrate');
  if (!shouldMigrateResults.succeeded) {
    discardedRepos.push(repo);
    await removeRepoDirectories(adapter, repo);
    repoLogs.push('Error running should_migrate steps; skipping');
    return;
  }

  repoLogs.push('Completed all should_migrate steps successfully');
  repoLogs.push('> Running post_checkout steps');
  const postCheckoutResults = await executeSteps(context, repo, 'post_checkout');
  if (!postCheckoutResults.succeeded) {
    discardedRepos.push(repo);
    await removeRepoDirectories(adapter, repo);
    repoLogs.push('Error running post_checkout steps; skipping');
  } else {
    repoLogs.push('Completed all post_checkout steps successfully');
    checkedOutRepos.push(repo);
  }
};

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
 * Checks out a list of repositories.
 *
 * @param context - The migration context containing the adapter and logger.
 * @param repos - The list of repositories to be checked out.
 * @param checkedOutRepos - The list to store successfully checked out repositories.
 * @param discardedRepos - The list to store repositories that were discarded during the checkout process.
 *
 * @returns A promise that resolves when all repositories have been processed.
 */
const checkoutRepos = async (
  context: IMigrationContext,
  repos: IRepo[],
  checkedOutRepos: IRepo[],
  discardedRepos: IRepo[]
) => {
  const { adapter, logger } = context;
  let count = 1;

  logger.info('Checking out repos');
  await forEachRepo(context, { warnMissingDirectory: false }, async (repo) => {
    const repoLogs: string[] = [];
    logRepoInfo(repo, count++, repos.length, adapter, repoLogs);
    await handleRepoCheckout(context, repo, checkedOutRepos, discardedRepos, repoLogs);
    repoLogs.forEach((log) => logger.info(log));
  });

  logger.info('');
  logger.info(`Checked out ${checkedOutRepos.length} out of ${repos.length} repos`);
};

/**
 * The purpose of the checkout function in the checkout.ts file is to manage the process
 * of checking out repositories within a migration context. It handles the extraction
 * of necessary dependencies, manages rate limits, loads and updates repositories,
 * and tracks the status of each repository throughout the checkout process.
 * This function ensures that the repositories are correctly checked out and mapped,
 * updating the migration context accordingly.
 *
 * @param context - The migration context containing necessary dependencies and state.
 * @returns A promise that resolves when the checkout process is complete.
 */
export default async (context: IMigrationContext) => {
  const { adapter, logger } = context;
  const onRetry = (numSeconds: number) =>
    logger.info(`Hit rate limit; waiting ${numSeconds} seconds and retrying.`);

  const repos = await loadRepos(context, onRetry);

  context.migration.repos = repos;

  const checkedOutRepos: IRepo[] = [];
  const discardedRepos: IRepo[] = [];

  await checkoutRepos(context, repos, checkedOutRepos, discardedRepos);

  const mappedCheckedOutRepos = await Promise.all(
    checkedOutRepos.map((repo) => adapter.mapRepoAfterCheckout(repo))
  );

  await updateRepoList(context, mappedCheckedOutRepos, discardedRepos);
};
