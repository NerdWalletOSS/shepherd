import fs from 'fs-extra-promise';

import IRepoAdapter, { IRepo } from '../adapters/base';
import { IMigrationContext } from '../migration-context';
import executeSteps from '../util/execute-steps';
import forEachRepo from '../util/for-each-repo';
import { updateRepoList } from '../util/persisted-data';

const removeRepoDirectories = async (adapter: IRepoAdapter, repo: IRepo) => {
  await fs.removeAsync(adapter.getRepoDir(repo));
  await fs.removeAsync(adapter.getDataDir(repo));
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
    // Get component that's being searched for...
    const query = context.migration.spec.adapter.search_query;
    const component = query.match(/react-([a-z]-*)*\w/g);

    const spinner = logger.spinner(`🔍 Finding repos with ${component}...`);
    repos = await adapter.getCandidateRepos(onRetry);
    spinner.succeed(`Loaded ${repos.length} repos`);
  }

  context.migration.repos = repos;
  console.log(context.migration.repos);
  console.log('Done!');
  return;

  const checkedOutRepos: IRepo[] = [];
  const discardedRepos: IRepo[] = [];

  const options = { warnMissingDirectory: false };

  await forEachRepo(context, options, async (repo) => {
    // const spinner = logger.spinner('WOW Checking out repo');
    console.log('For each...')
    try {
      // await adapter.checkoutRepo(repo);
      // spinner.succeed('Checked out repo');
    } catch (e) {
      logger.error(e);
      // spinner.fail('Failed to check out repo; skipping');
      return;
    }

    // We need to create the data directory before running should_migrate
    await fs.mkdirsAsync(adapter.getDataDir(repo));

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
