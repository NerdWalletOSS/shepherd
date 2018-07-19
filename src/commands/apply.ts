import { IMigrationContext } from '../migration-context';
import executeSteps from '../util/execute-steps';
import forEachRepo from '../util/for-each-repo';

export default async (context: IMigrationContext): Promise<void> => {
  const { adapter, logger } = context;

  forEachRepo(context, async (repo) => {
    logger.info('> Running apply steps');
    const stepsResults = await executeSteps(context, repo, 'apply');
    if (!stepsResults.succeeded) {
      logger.error('> Failed to run all apply steps');
      const spinner = logger.spinner('Resetting repo');
      try {
        await adapter.resetRepo(repo);
        spinner.succeed('Successfully reset repo');
      } catch (e) {
        logger.error(e);
        spinner.fail('Failed to reset repo');
      }
    } else {
      logger.info('> Completed all apply steps successfully');
    }
  });
};
