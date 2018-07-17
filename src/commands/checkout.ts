import fs from 'fs-extra';
import ora from 'ora';

import execInRepo from '../util/exec-in-repo';
import { updateRepoList } from '../util/persisted-data';
import { MigrationContext } from '../migration-context';
import BaseAdapter, { Repo } from '../adapters/base';

const removeRepoDirectories = async (adapter: BaseAdapter, repo: Repo) => {
  fs.removeSync(await adapter.getRepoDir(repo));
  fs.removeSync(await adapter.getDataDir(repo));
};

export default async (context: MigrationContext) => {
  const {
    migration: { spec, selectedRepos },
    adapter,
  } = context;

  let repos;
  if (selectedRepos) {
    ora(`Using ${selectedRepos.length} selected repos`).succeed();
    repos = selectedRepos;
  } else {
    const spinner = ora('Loading candidate repos from GitHub').start();
    repos = await adapter.getCandidateRepos();
    spinner.succeed(`Loaded ${repos.length} repos`);
  }

  const checkedOutRepos = [];
  const discardedRepos = [];

  for (const repo of repos) {
    console.log(`\n[${adapter.formatRepo(repo)}]`);
    let spinner = ora('Checking out repo').start();
    await adapter.checkoutRepo(repo);
    spinner.succeed('Checked out repo');

    spinner = ora('Running should_migrate steps').start();
    const shouldMigrateSteps = spec.should_migrate || [];
    let shouldMigrate = true;
    for (const step of shouldMigrateSteps) {
      try {
        await execInRepo(adapter, repo, step);
      } catch (e) {
        shouldMigrate = false;
        discardedRepos.push(repo);
        spinner.clear();
        console.warn(e.stderr);
        spinner.fail(`should_migrate step exited with exit code ${e.code}, skipping repo`);
        break;
      }
    }
    if (!shouldMigrate) {
      removeRepoDirectories(adapter, repo);
    } else {
      spinner.succeed('Repo passed all should_migrate steps');

      spinner = ora('Running post_checkout steps').start();
      const postCheckoutSteps = spec.post_checkout || [];
      let postCheckoutSucceeded = true;
      for (const step of postCheckoutSteps) {
        try {
          await execInRepo(adapter, repo, step);
        } catch (e) {
          postCheckoutSucceeded = false;
          discardedRepos.push(repo);
          spinner.clear();
          console.warn(e.stderr);
          spinner.fail(`post_checkout step exited with exit code ${e.code}, skipping repo`);
          break;
        }
      }
      if (!postCheckoutSucceeded) {
        removeRepoDirectories(adapter, repo);
      } else {
        spinner.succeed('post_checkout steps completed successfully');
        checkedOutRepos.push(repo);
      }
    }
  }

  // We'll persist this list of repos for use in future steps
  updateRepoList(context, checkedOutRepos, discardedRepos);
};
