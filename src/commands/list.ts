import { IMigrationContext } from '../migration-context';

export default async (context: IMigrationContext) => {
  const {
    migration: { repos },
    logger,
    adapter,
  } = context;

  for (const repo of repos || []) {
    logger.info(adapter.stringifyRepo(repo));
  }
};
