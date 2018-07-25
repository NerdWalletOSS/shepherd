import { IMigrationContext } from '../migration-context';
import executeSteps from '../util/execute-steps';
import forEachRepo from '../util/for-each-repo';
import { generatePrMessageWithFooter } from '../util/generate-pr-message';

export default async (context: IMigrationContext) => {
  const {
    migration: { spec },
    logger,
  } = context;

  if (!spec.hooks.pr_message || spec.hooks.pr_message.length === 0) {
    logger.error('No pr_message hook specified in the migration spec');
    return;
  }

  await forEachRepo(context, async (repo) => {
    const spinner = logger.spinner('Generating PR message');
    const stepResults = await executeSteps(context, repo, 'pr_message', false);
    if (!stepResults.succeeded) {
      spinner.fail('Failed to generate PR message');
      return;
    }

    const message = generatePrMessageWithFooter(stepResults);
    if (!message) {
      spinner.warn('Generated PR message was empty');
      return;
    }
    spinner.succeed('Generated PR message');

    const prSpinner = logger.spinner('Creating pull request');
    try {
      await context.adapter.prRepo(repo, message);
      prSpinner.succeed('Pull request created');
    } catch (e) {
      logger.error(e);
      prSpinner.fail('Failed to create pull request');
    }
  });
};
