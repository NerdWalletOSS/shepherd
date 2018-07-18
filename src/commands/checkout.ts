import fs from 'fs-extra';

import BaseAdapter, { IRepo } from '../adapters/base';
import { IMigrationContext } from '../migration-context';
import execInRepo from '../util/exec-in-repo';
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
    let spinner = logger.spinner('Checking out repo');
    try {
      await adapter.checkoutRepo(repo);
      spinner.succeed('Checked out repo');
    } catch (e) {
      logger.warn(e);
      spinner.fail('Failed to check out repo, skipping');
      return;
    }

    spinner = logger.spinner('Running should_migrate steps');
    const shouldMigrateSteps = spec.should_migrate || [];
    let shouldMigrate = true;
    for (const step of shouldMigrateSteps) {
      try {
        await execInRepo(adapter, repo, step);
      } catch (e) {
        shouldMigrate = false;
        discardedRepos.push(repo);
        logger.warn(e.stderr.strim());
        spinner.fail(`should_migrate step exited with exit code ${e.code}, skipping repo`);
        break;
      }
    }
    if (!shouldMigrate) {
      removeRepoDirectories(adapter, repo);
    } else {
      spinner.succeed('Completed all should_migrate steps successfully');

      spinner = logger.spinner('Running post_checkout steps');
      const postCheckoutSteps = spec.post_checkout || [];
      let postCheckoutSucceeded = true;
      for (const step of postCheckoutSteps) {
        try {
          await execInRepo(adapter, repo, step);
        } catch (e) {
          postCheckoutSucceeded = false;
          discardedRepos.push(repo);
          logger.warn(e.stderr.trim());
          spinner.fail(`post_checkout step exited with exit code ${e.code}, skipping repo`);
          break;
        }
      }
      if (!postCheckoutSucceeded) {
        removeRepoDirectories(adapter, repo);
      } else {
        spinner.succeed('Completed all post_checkout steps successfully');
        checkedOutRepos.push(repo);
      }
    }
  });

  // We'll persist this list of repos for use in future steps
  updateRepoList(context, checkedOutRepos, discardedRepos);
};
