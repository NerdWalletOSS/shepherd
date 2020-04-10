import chalk from 'chalk';
import fs from 'fs-extra';
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

  // We want to show these warnings by default and allow opt-out of them
  const { warnMissingDirectory = true } = options;

  // If `selectedRepos` is specified, we should use that instead of the full repo list
  let repos;
  if (selectedRepos && selectedRepos.length) {
    // If this repo was already checked out, it may have additional metadata
    // associated with it that came from the adapter's mapRepoAfterCheckout
    // Let's rely on the migrations from the list on disk if at all possible
    repos = selectedRepos.map((r) => {
      const existingRepo = (migrationRepos || []).find((repo) => adapter.reposEqual(r, repo));
      return existingRepo || r;
    });
  } else {
    repos = migrationRepos || [];
  }

  let index = 0;
  for (const repo of repos) {
    index += 1;
    const indexString = chalk.dim(`${index}/${repos.length}`);
    logger.info(chalk.bold(`\n[${adapter.stringifyRepo(repo)}] ${indexString}`));

    // Quick sanity check in case we're working from user-selected repos
    const repoDir = adapter.getRepoDir(repo);
    if (warnMissingDirectory && !await fs.pathExists(repoDir)) {
      logger.error(`Directory ${repoDir} does not exist`);
    }

    await handler(repo);
  }
};
