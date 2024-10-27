import { IMigrationContext } from '../migration-context.js';
import forEachRepo from '../util/for-each-repo.js';

const determineRepoPRStatus = async (context: IMigrationContext, repo: any) => {
  const { logger, adapter } = context;
  const spinner = logger.spinner('Determining repo PR status');

  try {
    const status = await adapter.getPullRequestStatus(repo);
    spinner.destroy();
    status.forEach((s) => logger.info(s));
  } catch (error: any) {
    logger.error(error);
    spinner.fail('Failed to determine PR status');
  }
};

export default async (context: IMigrationContext) => {
  await forEachRepo(context, async (repo) => {
    await determineRepoPRStatus(context, repo);
  });
};
