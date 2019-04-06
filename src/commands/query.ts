import { IMigrationContext } from '../migration-context';

export default async (context: IMigrationContext) => {
  const { migration, adapter, logger } = context;

  // Get component that's being searched for...
  const query = migration.spec.adapter.search_query;
  const component = query.match(/react-([a-z]-*)*\w/g);
  const spinner = logger.spinner(`Finding repos with ${component}...`);

  const onRetry = (numSeconds: number) => {
    logger.info(`Hit rate limit; waiting ${numSeconds} seconds and retrying.`);
  };
  const repos = await adapter.getCandidateRepos(onRetry);

  // Log discovered repos
  spinner.succeed(`Found ${repos.length} repos:`);
  for (const repo of repos || []) {
    logger.infoIcon(adapter.stringifyRepo(repo));
  }

  logger.succeedIcon('Done!');
};
