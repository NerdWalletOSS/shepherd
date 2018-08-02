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

  let repos;
  if (selectedRepos) {
    logger.info(`Using ${selectedRepos.length} selected repos`);
    repos = selectedRepos;
  } else {
    const spinner = logger.spinner('Loading candidate repos');
    repos = await adapter.getCandidateRepos();
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
      logger.warn(e);
      spinner.fail('Failed to check out repo, skipping');
      return;
    }

    logger.info('> Running should_migrate steps');
    const stepsResults = await executeSteps(context, repo, 'should_migrate');
    if (!stepsResults.succeeded) {
      discardedRepos.push(repo);
      await removeRepoDirectories(adapter, repo);
      logger.failIcon('Error running should_migrate steps; skipping repo');
    } else {
      logger.succeedIcon('Completed all should_migrate steps successfully');

      logger.info('> Running post_checkout steps');
      const postCheckoutStepsResults = await executeSteps(context, repo, 'post_checkout');
      if (!postCheckoutStepsResults.succeeded) {
        discardedRepos.push(repo);
        await removeRepoDirectories(adapter, repo);
        logger.failIcon('Error running post_checkout steps; skipping repo');
      } else {
        logger.succeedIcon('Completed all post_checkout steps successfully');
        checkedOutRepos.push(repo);
      }
    }
  });

  logger.info('');
  logger.succeedIcon(`Checked out ${checkedOutRepos.length} out of ${repos.length} repos`);

  // We'll persist this list of repos for use in future steps
  await updateRepoList(context, checkedOutRepos, discardedRepos);
};
