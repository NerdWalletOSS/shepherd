import { IMigrationContext } from '../migration-context';
import executeSteps from '../util/execute-steps';
import forEachRepo from '../util/for-each-repo';

export default async (context: IMigrationContext, options: any): Promise<void> => {
  const { adapter, logger } = context;

  await forEachRepo(context, async (repo) => {
    const resetSpinner = logger.spinner('Removing uncommitted changes');
    try {
      await adapter.resetChangedFiles(repo);
      resetSpinner.succeed('Successfully reset repo');
    } catch (e) {
      logger.error(e);
      resetSpinner.fail('Failed to remove changes; not applying migration');
      return;
    }

    if (options.skipResetBranch) {
      logger.info('Not resetting branch');
    } else {
      const resetBranchSpinner = logger.spinner('Resetting branch');
      try {
        await adapter.resetRepoBeforeApply(repo, options.forceResetBranch);
        resetBranchSpinner.succeed('Successfully reset branch');
      } catch (e) {
        logger.error(e);
        resetBranchSpinner.fail('Failed to reset branch; not applying migration');
      }
    }

    logger.infoIcon('Running apply steps');
    const stepsResults = await executeSteps(context, repo, 'apply');
    if (stepsResults.succeeded) {
      logger.succeedIcon('Completed all apply steps successfully');
      return;
    }

    logger.error('> Failed to run all apply steps');
    if (options.skipResetOnError) {
      logger.info('Not resetting repo');
    } else {
      const spinner = logger.spinner('Resetting repo');
      try {
        await adapter.resetChangedFiles(repo);
        spinner.succeed('Successfully reset repo');
      } catch (e) {
        logger.error(e);
        spinner.fail('Failed to reset repo');
      }
    }
  });
};
