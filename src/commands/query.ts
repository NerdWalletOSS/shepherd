import { IMigrationContext } from '../migration-context';

export default async (context: IMigrationContext, options: any) => {
  const { migration, adapter, logger } = context;

  let query;
  if (options.package) {
    logger.infoIcon(`package flag detected; using ${options.package} directly`);
    query = `org:NerdWallet ${options.package} in:file filename:package.json path:/`;
  } else {
    query = migration.spec.adapter.search_query;
    logger.infoIcon('Defaulting to migration spec from shepherd.yml');
  }

  // Extract component name ('react-x') that's being searched for...
  const component = query.match(/react-([a-z]-*)*\w/g);
  const spinner = logger.spinner(`Querying repos that have installed ${component}...`);

  const onRetry = (numSeconds: number) => {
    logger.info(`Hit rate limit; waiting ${numSeconds} seconds and retrying.`);
  };
  const repos = await adapter.getCandidateRepos(onRetry);

  spinner.succeed(`Found ${component} in ${repos.length} repos:`);
  for (const repo of repos || []) {
    logger.info(` ${adapter.stringifyRepo(repo)}`);
  }
};
