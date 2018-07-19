import { IMigrationContext } from '../migration-context';
import forEachRepo from '../util/for-each-repo';

export default async (context: IMigrationContext) => {
  const {
    adapter,
    logger,
  } = context;

  forEachRepo(context, async (repo) => {
    const spinner = logger.spinner('Committing changes');
    try {
      await adapter.commitRepo(repo);
      spinner.succeed('Changes committed');
    } catch (e) {
      logger.error(e);
      spinner.fail('Failed to commit changes');
    }
  });
};
