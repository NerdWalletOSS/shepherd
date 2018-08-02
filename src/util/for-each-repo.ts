import chalk from 'chalk';
import { existsAsync } from 'fs-extra-promise';
import { IRepo } from '../adapters/base';
import { IMigrationContext } from '../migration-context';

type RepoHandler = (repo: IRepo) => Promise<void>;

interface IOptions {
  noWarnMissingDirectory?: boolean;
}

export default async (context: IMigrationContext, handler: RepoHandler, options?: IOptions) => {
  const {
    migration: {
      repos: migrationRepos,
      selectedRepos,
    },
    logger,
    adapter,
  } = context;

  const opts = options || {};

  // if `selectedRepos` is specified, we should use that instead of the full repo list
  let repos;
  if (selectedRepos && selectedRepos.length) {
    repos = selectedRepos;
  } else {
    repos = migrationRepos || [];
  }

  for (const repo of repos) {
    logger.info(chalk.bold(`\n[${adapter.stringifyRepo(repo)}]`));

    // Quick sanity check in case we're working from user-selected repos
    const repoDir = adapter.getRepoDir(repo);
    if (!opts.noWarnMissingDirectory && !await existsAsync(repoDir)) {
      logger.error(`Directory ${repoDir} does not exist`);
    }

    await handler(repo);
  }
};
