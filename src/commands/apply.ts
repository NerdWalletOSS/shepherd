import { IMigrationContext } from '../migration-context';
import executeSteps from '../util/execute-steps';
import forEachRepo from '../util/for-each-repo';

export default async (context: IMigrationContext): Promise<void> => {
  const { adapter, logger } = context;

  forEachRepo(context, async (repo) => {
    const resetSpinner = logger.spinner('Resetting repo before apply');
    try {
      await adapter.resetRepo(repo);
      resetSpinner.succeed('Successfully reset repo');
    } catch (e) {
      logger.error(e);
      resetSpinner.fail('Failed to reset repo; not applying migration');
      return;
    }

    logger.infoIcon('Running apply steps');
    const stepsResults = await executeSteps(context, repo, 'apply');
    if (stepsResults.succeeded) {
      logger.succeedIcon('Completed all apply steps successfully');
      return;
    } else {
      logger.error('> Failed to run all apply steps');
      const spinner = logger.spinner('Resetting repo');
      try {
        await adapter.resetRepo(repo);
        spinner.succeed('Successfully reset repo');
      } catch (e) {
        logger.error(e);
        spinner.fail('Failed to reset repo');
      }
    }
  });
};
