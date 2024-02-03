import { IMigrationContext } from '../migration-context.js';
import forEachRepo from '../util/for-each-repo.js';

export default async (context: IMigrationContext) => {
  const { adapter, logger } = context;

  await forEachRepo(context, async (repo) => {
    const spinner = logger.spinner('Resetting changes');
    try {
      await adapter.resetChangedFiles(repo);
      spinner.succeed('Reset changes');
    } catch (e) {
      logger.error(e as string);
      spinner.fail('Failed to reset changes');
    }
  });
};
