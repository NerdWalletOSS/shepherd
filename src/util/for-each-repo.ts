import chalk from 'chalk';
import { IRepo } from '../adapters/base';
import { IMigrationContext } from '../migration-context';

type RepoHandler = (repo: IRepo) => Promise<void>;

export default async (context: IMigrationContext, handler: RepoHandler) => {
  const {
    migration: { repos },
    logger,
    adapter,
  } = context;

  for (const repo of (repos || [])) {
    logger.info(chalk.bold(`\n[${adapter.formatRepo(repo)}]`));
    await handler(repo);
  }
};
