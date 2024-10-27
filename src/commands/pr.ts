import { IMigrationContext } from '../migration-context.js';
import executeSteps from '../util/execute-steps.js';
import forEachRepo from '../util/for-each-repo.js';
import { generatePrMessageWithFooter } from '../util/generate-pr-message.js';

const generateAndCreatePr = async (
  context: IMigrationContext,
  repo: any,
  upstreamOwner: string
) => {
  const { logger } = context;

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
};

/**
 * Executes the pull request creation process for each repository defined in the migration context.
 *
 * @param context - The migration context containing necessary information such as migration specifications and logger.
 * @returns A promise that resolves when the PR creation process is complete for all repositories.
 *
 * @remarks
 * This function expects the `pr_message` hook to be defined in the migration specification. If it is not defined,
 * an error will be logged and the function will return early.
 *
 * @throws Will throw an error if the `pr_message` hook is not specified in the migration spec.
 */
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
    await generateAndCreatePr(context, repo, upstreamOwner);
  });
};
