import fs from 'fs-extra';

import IRepoAdapter, { IRepo } from '../adapters/base';
import { IMigrationContext } from '../migration-context';
import executeSteps from '../util/execute-steps';
import forEachRepo from '../util/for-each-repo';
import { updateRepoList } from '../util/persisted-data';

const removeRepoDirectories = async (adapter: IRepoAdapter, repo: IRepo) => {
  await fs.remove(adapter.getRepoDir(repo));
  await fs.remove(adapter.getDataDir(repo));
};

export default async (context: IMigrationContext) => {
  const {
    migration: { selectedRepos },
    adapter,
    logger,
  } = context;

  function onRetry(numSeconds: number) {
    logger.info(`Hit rate limit; waiting ${numSeconds} seconds and retrying.`);
  }

  let repos;
  if (selectedRepos) {
    logger.info(`Using ${selectedRepos.length} selected repos`);
    repos = selectedRepos;
  } else {
    const spinner = logger.spinner('Loading candidate repos');
    repos = await adapter.getCandidateRepos(onRetry);
    spinner.succeed(`Loaded ${repos.length} repos`);
  }

  context.migration.repos = repos;

  const checkedOutRepos: IRepo[] = [];
  const discardedRepos: IRepo[] = [];

  const options = { warnMissingDirectory: false };

  await forEachRepo(context, options, async (repo) => {
    const spinner = logger.spinner('Checking out repo');
    try {
      await adapter.checkoutRepo(repo);
      spinner.succeed('Checked out repo');
    } catch (e) {
      logger.error(e);
      spinner.fail('Failed to check out repo; skipping');
      return;
    }

    // We need to create the data directory before running should_migrate
    await fs.mkdirs(adapter.getDataDir(repo));

    logger.info('> Running should_migrate steps');
    const stepsResults = await executeSteps(context, repo, 'should_migrate');
    if (!stepsResults.succeeded) {
      discardedRepos.push(repo);
      await removeRepoDirectories(adapter, repo);
      logger.failIcon('Error running should_migrate steps; skipping');
    } else {
      logger.succeedIcon('Completed all should_migrate steps successfully');

      logger.info('> Running post_checkout steps');
      const postCheckoutStepsResults = await executeSteps(context, repo, 'post_checkout');
      if (!postCheckoutStepsResults.succeeded) {
        discardedRepos.push(repo);
        await removeRepoDirectories(adapter, repo);
        logger.failIcon('Error running post_checkout steps; skipping');
      } else {
        logger.succeedIcon('Completed all post_checkout steps successfully');
        checkedOutRepos.push(repo);
      }
    }
  });

  logger.info('');
  logger.info(`Checked out ${checkedOutRepos.length} out of ${repos.length} repos`);

  const mappedCheckedOutRepos = [];
  for (const repo of checkedOutRepos) {
    mappedCheckedOutRepos.push(await adapter.mapRepoAfterCheckout(repo));
  }

  // We'll persist this list of repos for use in future steps
  await updateRepoList(context, mappedCheckedOutRepos, discardedRepos);
};
