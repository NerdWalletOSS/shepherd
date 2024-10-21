import { IMigrationContext } from '../migration-context.js';
import forEachRepo from '../util/for-each-repo.js';
import { IssueTracker } from '../adapters/base.js';
import {
  getIssueListsFromTracker,
  updatePostedIssuesLists,
  removeRepoDirectories,
} from '../util/persisted-data.js';
import executeSteps from '../util/execute-steps.js';

export default async (context: IMigrationContext) => {
  const {
    adapter,
    logger,
    migration: { spec },
  } = context;

  const spinner = logger.spinner('Issue command');
  if (spec.issues === undefined || spec.issues.title === undefined) {
    spinner.fail('No issues in the shepherd yml to post');
    return;
  }

  try {
    const title = spec.issues.title;
    const issuesList: IssueTracker[] = await getIssueListsFromTracker(context);
    let status = spec.issues.state;

    if (!status) {
      status = 'open';
    }
    await forEachRepo(context, async (repo) => {
      logger.spinner('Posting an issue');

      const stepsResults = await executeSteps(context, repo, 'should_create_issue');
      if (!stepsResults.succeeded) {
        await removeRepoDirectories(adapter, repo);
        spinner.fail('Error running should_create_issue steps; skipping');
      } else {
        const issueNumber = issuesList
          .find((issue) => issue.repo === repo.name)
          ?.issueNumber?.toString();

        if (issueNumber) {
          await adapter.updateIssue(repo, issueNumber);
          issuesList
            .filter((issueFromTracker) => issueFromTracker.issueNumber === issueNumber)
            .map((specificIssue) => (specificIssue.title = title));
          spinner.succeed(`Issue updated issueNumber# ${issueNumber} for repo ${repo.name}`);
        } else {
          const issueNumber: any = await adapter.createIssue(repo);
          issuesList.push({
            issueNumber,
            title,
            owner: repo.owner,
            status,
            repo: repo.name,
          });
          spinner.succeed('Issue posted in the repository');
        }
      }
    });
    //Add the opened issues with issue_number and repo in the issue_tracker.json
    if (issuesList.length > 0) {
      await updatePostedIssuesLists(context, issuesList);
      spinner.succeed('Issue updated in the tracker');
    }
  } catch (e: any) {
    logger.error(e + 'Error to post/update issue');
    spinner.fail('Failed to post/update an issue');
  }
};
