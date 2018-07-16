const { exec } = require('child-process-promise');
const fs = require('fs-extra');
const ora = require('ora');

const removeRepoDirectories = (adapter, repo) => {
  fs.removeSync(adapter.getRepoDir(repo));
  fs.removeSync(adapter.getDataDir(repo));
};

module.exports = async (context) => {
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

  for (const repo of repos) {
    const repoDir = await adapter.getRepoDir(repo);

    console.log(`\n[${adapter.formatRepo(repo)}]`);
    let spinner = ora('Checking out repo').start();
    await adapter.checkoutRepo(repo);
    spinner.succeed('Checked out repo');

    spinner = ora('Running should_migrate hooks').start();
    const shouldMigrateSteps = spec.should_migrate || [];
    let shouldMigrate = true;
    for (const step of shouldMigrateSteps) {
      try {
        await exec(step, { cwd: repoDir });
      } catch (e) {
        spinner.clear();
        console.warn(e.stderr);
        spinner.fail(`should_migrate step exited with exit code ${e.code}, skipping repo`);
        shouldMigrate = false;
        break;
      }
    }
    if (!shouldMigrate) {
      removeRepoDirectories(adapter, repo);
    } else {
      spinner.succeed('Repo passed all should_migrate hooks');

      spinner = ora('Running post_checkout hooks').start();
      const postCheckoutSteps = spec.post_checkout || [];
      let postCheckoutSucceeded = true;
      for (const step of postCheckoutSteps) {
        try {
          await exec(step, { cwd: repoDir });
        } catch (e) {
          spinner.clear();
          console.warn(e.stderr);
          spinner.fail(`post_checkout step exited with exit code ${e.code}, skipping repo`);
          postCheckoutSucceeded = false;
          break;
        }
      }
      if (!postCheckoutSucceeded) {
        removeRepoDirectories(adapter, repo);
      } else {
        spinner.succeed('Completed all post_checkout hooks');
      }
    }
  }
};
