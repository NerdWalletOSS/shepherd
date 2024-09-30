import { IMigrationContext } from '../migration-context.js';
import forEachRepo from '../util/for-each-repo.js';

export default async (context: IMigrationContext) => {
  const { logger, adapter } = context;

  await forEachRepo(context, async (repo) => {
    const spinner = logger.spinner('Determining repo PR status');
    try {
      const status = await adapter.getPullRequestStatus(repo);
      spinner.destroy();
      status.forEach((s) => logger.info(s));
    } catch (e: any) {
      logger.error(e);
      spinner.fail('Failed to determine PR status');
    }
  });
};
