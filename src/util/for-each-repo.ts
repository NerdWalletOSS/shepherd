import chalk from 'chalk';
import { existsAsync } from 'fs-extra-promise';
import { IRepo } from '../adapters/base';
import { IMigrationContext } from '../migration-context';

type RepoHandler = (repo: IRepo) => Promise<void>;

interface IOptions {
  warnMissingDirectory?: boolean;
}

export default async (context: IMigrationContext, param1: (RepoHandler | IOptions), param2?: RepoHandler) => {
  const {
    migration: {
      repos: migrationRepos,
      selectedRepos,
    },
    logger,
    adapter,
  } = context;

  let handler: RepoHandler;
  let options: IOptions;
  if (typeof param1 === 'function') {
    // No options were provided
    options = {};
    handler = param1;
  } else {
    // We got options!
    options = param1;
    handler = param2 as RepoHandler;
  }

  let { warnMissingDirectory } = options;
  if (warnMissingDirectory === undefined) {
    // Default to true
    warnMissingDirectory = true;
  }

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
    if (warnMissingDirectory && !await existsAsync(repoDir)) {
      logger.error(`Directory ${repoDir} does not exist`);
    }

    await handler(repo);
  }
};
