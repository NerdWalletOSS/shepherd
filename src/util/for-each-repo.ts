import chalk from 'chalk';
import { existsAsync } from 'fs-extra-promise';
import { IRepo } from '../adapters/base';
import { IMigrationContext } from '../migration-context';

type RepoHandler = (repo: IRepo) => Promise<void>;

export default async (context: IMigrationContext, handler: RepoHandler) => {
  const {
    migration: {
      repos: migrationRepos,
      selectedRepos,
    },
    logger,
    adapter,
  } = context;

  // if `selectedRepos` is specified, we should use that instead of the full repo list
  let repos;
  if (selectedRepos && selectedRepos.length) {
    repos = selectedRepos;
  } else {
    repos = migrationRepos || [];
  }

  for (const repo of repos) {
    logger.info(chalk.bold(`\n[${adapter.formatRepo(repo)}]`));
    // Quick sanity check in case we're working from user-selected repos
    const repoDir = adapter.getRepoDir(repo);
    if (!await existsAsync(repoDir)) {
      // TODO disable this during the checkout phase
      logger.error(`Directory ${repoDir} does not exist`);
    }
    await handler(repo);
  }
};
