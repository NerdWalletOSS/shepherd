import { IMigrationContext } from '../migration-context';
import executeSteps from '../util/execute-steps';
import forEachRepo from '../util/for-each-repo';

export default async (context: IMigrationContext, options: any): Promise<void> => {
  const { adapter, logger } = context;

  await forEachRepo(context, async (repo) => {
    const resetSpinner = logger.spinner('Removing uncommitted changes');
    try {
      await adapter.resetRepo(repo);
      resetSpinner.succeed('Successfully reset repo');
    } catch (e) {
      logger.error(e);
      resetSpinner.fail('Failed to remove changes; not applying migration');
      return;
    }

    const updateRepoSpinner = logger.spinner('Updating repo with latest changes from remote');
    try {
      await adapter.updateRepo(repo);
      updateRepoSpinner.succeed('Successfully updated repo');
    } catch (e) {
      logger.error(e);
      updateRepoSpinner.fail('Failed to update repo. Proceed with caution!');
    }

    const canResetBranchSpinner = logger.spinner('Checking if branch can be reset');
    try {
      const canResetBranch = await adapter.canResetBranch(repo);
      if (!canResetBranch) {
        canResetBranchSpinner.fail('Cannot reset branch. Proceed with caution!');
      }
      canResetBranchSpinner.succeed('Branch is able to be reset');
    } catch (e) {
      logger.error(e);
      canResetBranchSpinner.fail('Cannot reset branch. Proceed with caution!');
    }

    const resetBranchSpinner = logger.spinner('Resetting branch');
    try {
      await adapter.resetBranch(repo);
      resetBranchSpinner.succeed('Successfully reset branch');
    } catch (e) {
      logger.error(e);
      resetBranchSpinner.fail('Failed to reset branch. Proceed with caution!');
    }

    logger.infoIcon('Running apply steps');
    const stepsResults = await executeSteps(context, repo, 'apply');
    if (stepsResults.succeeded) {
      logger.succeedIcon('Completed all apply steps successfully');
      return;
    }

    logger.error('> Failed to run all apply steps');
    if (options.resetOnError) {
      const spinner = logger.spinner('Resetting repo');
      try {
        await adapter.resetRepo(repo);
        spinner.succeed('Successfully reset repo');
      } catch (e) {
        logger.error(e);
        spinner.fail('Failed to reset repo');
      }
    } else {
      logger.info('Not resetting repo');
    }
  });
};
