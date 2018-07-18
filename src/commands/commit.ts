import ora from 'ora';

import { IMigrationContext } from '../migration-context';
import forEachRepo from '../util/for-each-repo';

export default async (context: IMigrationContext) => {
  const {
    migration: { spec, repos },
    adapter,
    logger,
  } = context;

  forEachRepo(context, async (repo) => {
    const spinner = ora('Committing changes').start();
    try {
      await adapter.commitRepo(repo);
    } catch (e) {
      spinner.clear();
      logger.warn(e.stderr);
      spinner.fail('Failed to commit changes');
    }
  });
};
