import chalk from 'chalk';
import fs from 'fs-extra';
import { IRepo } from '../adapters/base.js';
import { IMigrationContext } from '../migration-context.js';

type RepoHandler = (repo: IRepo, header: string) => Promise<void>;

interface IOptions {
  warnMissingDirectory?: boolean;
}

const getRepos = (migrationRepos: IRepo[], selectedRepos: IRepo[], adapter: any): IRepo[] => {
  if (selectedRepos && selectedRepos.length) {
    return selectedRepos.map((r) => {
      const existingRepo = migrationRepos.find((repo) => adapter.reposEqual(r, repo));
      return existingRepo || r;
    });
  }
  return migrationRepos || [];
};

const logRepoInfo = (repo: IRepo, index: number, total: number, adapter: any) => {
  const indexString = chalk.dim(`${index}/${total}`);
  return chalk.bold(`\n[${adapter.stringifyRepo(repo)}] ${indexString}`);
};

const checkRepoDirectory = async (repoDir: string, warnMissingDirectory: boolean) => {
  if (warnMissingDirectory && !(await fs.pathExists(repoDir))) {
    return `Directory ${repoDir} does not exist`;
  }
  return '';
};

/**
 * Processes each repository in the migration context using the provided handler.
 *
 * @param context - The migration context containing repositories, logger, and adapter.
 * @param param1 - Either a repository handler function or options for processing.
 * @param param2 - Optional repository handler function if `param1` is options.
 *
 * @returns A promise that resolves when all repositories have been processed.
 *
 * The function extracts repositories from the migration context and applies the provided handler
 * to each repository. It logs warnings for missing directories and errors encountered during processing.
 *
 * @example
 * ```typescript
 * await forEachRepo(context, handler);
 * await forEachRepo(context, options, handler);
 * ```
 */
export default async (
  context: IMigrationContext,
  param1: RepoHandler | IOptions,
  param2?: RepoHandler
) => {
  const {
    migration: { repos: migrationRepos, selectedRepos },
    logger,
    adapter,
  } = context;

  const { handler, options } =
    typeof param1 === 'function'
      ? { handler: param1, options: {} as IOptions }
      : { handler: param2 as RepoHandler, options: param1 };

  const { warnMissingDirectory = true } = options;
  const repos = getRepos(migrationRepos || [], selectedRepos || [], adapter);

  const _handler = async function (repo: IRepo, index: number, repos: IRepo[]) {
    const repoDir = adapter.getRepoDir(repo);
    const dirCheckMessage = await checkRepoDirectory(repoDir, warnMissingDirectory);
    if (dirCheckMessage) {
      logger.warn(dirCheckMessage);
    }

    try {
      const header = logRepoInfo(repo, index + 1, repos.length, adapter);
      await handler(repo, header);
    } catch (error: unknown) {
      if (error instanceof Error) {
        logger.error(`Error processing repo ${adapter.stringifyRepo(repo)}: ${error.message}`);
      } else {
        logger.error(`Error processing repo ${adapter.stringifyRepo(repo)}: ${String(error)}`);
      }
    }
  };

  const repoListWithHandlersApplied = repos.map(_handler);

  await Promise.all(repoListWithHandlersApplied);
};
