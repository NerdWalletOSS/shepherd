import fs from 'fs-extra';

import BaseAdapter, { IRepo } from '../adapters/base';
import { IMigrationContext } from '../migration-context';
import executeSteps from '../util/execute-steps';
import forEachRepo from '../util/for-each-repo';
import { updateRepoList } from '../util/persisted-data';

const removeRepoDirectories = async (adapter: BaseAdapter, repo: IRepo) => {
  fs.removeSync(await adapter.getRepoDir(repo));
  fs.removeSync(await adapter.getDataDir(repo));
};

export default async (context: IMigrationContext) => {
  const {
    migration: { spec, selectedRepos },
    adapter,
    logger,
  } = context;

  let repos;
  if (selectedRepos) {
    logger.spinner(`Using ${selectedRepos.length} selected repos`).succeed();
    repos = selectedRepos;
  } else {
    const spinner = logger.spinner('Loading candidate repos from GitHub');
    repos = await adapter.getCandidateRepos();
    spinner.succeed(`Loaded ${repos.length} repos`);
  }

  context.migration.repos = repos;

  const checkedOutRepos: IRepo[] = [];
  const discardedRepos: IRepo[] = [];

  forEachRepo(context, async (repo) => {
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
    const shouldMigrate = await executeSteps(context, repo, 'should_migrate');
    if (!shouldMigrate) {
      discardedRepos.push(repo);
      removeRepoDirectories(adapter, repo);
      logger.error('> Error running should_migrate steps; skipping repo');
    } else {
      logger.info('> Completed all should_migrate steps successfully');

      logger.info('> Running post_checkout steps');
      const postCheckoutSucceeded = await executeSteps(context, repo, 'post_checkout');
      if (!postCheckoutSucceeded) {
        discardedRepos.push(repo);
        removeRepoDirectories(adapter, repo);
        logger.error('> Error running post_checkout steps; skipping repo');
      } else {
        logger.info('> Completed all post_checkout steps successfully');
        checkedOutRepos.push(repo);
      }
    }
  });

  // We'll persist this list of repos for use in future steps
  updateRepoList(context, checkedOutRepos, discardedRepos);
};
