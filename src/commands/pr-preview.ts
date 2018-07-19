import { IMigrationContext } from '../migration-context';
import executeSteps from '../util/execute-steps';
import forEachRepo from '../util/for-each-repo';
import generatePrMessage from '../util/generate-pr-message';

export default async (context: IMigrationContext) => {
  const { adapter, logger } = context;

  forEachRepo(context, async (repo) => {
    const spinner = logger.spinner('Generating PR message');
    const stepResults = await executeSteps(context, repo, 'pr_message', false);
    if (!stepResults.succeeded) {
      spinner.fail('Failed to generate PR message');
    } else {
      spinner.succeed('Generated PR message');
      const message = generatePrMessage(stepResults);
      logger.info('=========');
      if (message) {
        logger.info(message);
      } else {
        logger.warn('[No message contents]');
      }
      logger.info('=========');
    }
  });
};
