import { IMigrationContext } from '../migration-context.js';
import executeSteps from '../util/execute-steps.js';
import forEachRepo from '../util/for-each-repo.js';
import { generatePrMessageWithFooter } from '../util/generate-pr-message.js';

export default async (context: IMigrationContext) => {
  const {
    migration: { spec, upstreamOwner },
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
      await context.adapter.createPullRequest(repo, message, upstreamOwner);
      prSpinner.succeed('Pull request created');
    } catch (e: any) {
      logger.error(e);
      prSpinner.fail('Failed to create pull request');
    }
  });
};
