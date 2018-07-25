import { IMigrationContext } from '../migration-context';
import forEachRepo from '../util/for-each-repo';

export default async (context: IMigrationContext) => {
  const { adapter, logger } = context;

  await forEachRepo(context, async (repo) => {
    const spinner = logger.spinner('Pushing changes');
    try {
      await adapter.pushRepo(repo);
      spinner.succeed('Changes pushed');
    } catch (e) {
      logger.error(e);
      spinner.fail('Failed to push changes');
    }
  });
};
