import { IMigrationContext } from '../migration-context';
import forEachRepo from '../util/for-each-repo';
import { issueTracker } from '../adapters/base';
import { getIssueNumberForRepo, updatePostedIssuesLists } from '../util/persisted-data';

export default async (context: IMigrationContext) => {
  const { logger } = context;

  const issuesList: issueTracker[] = [];

  await forEachRepo(context, async (repo) => {
    const spinner = logger.spinner('Posting an issue');
    try {
      logger.info("the issue"+repo.name);

      const issueNumber = await getIssueNumberForRepo(context, repo.name);

      if (issueNumber?.toString()) {
        await context.adapter.updateIssue(repo, issueNumber);
        spinner.succeed(`Issue updated issueNumber# ${issueNumber} for repo ${repo.name}`);
      } else {
        logger.info("the issue"+repo.name);
        const issueNumber: any = await context.adapter.createIssue(repo);
        issuesList.push({
          issueNumber,
          owner: repo.owner,
          repo: repo.name,
        });
        spinner.succeed('Issue created');
      }
    } catch (e: any) {
      logger.error(e);
      spinner.fail('Failed to create/update issue');
    }
  });

  //Add the opened issues with issue_number and repo in the issue_tracker.json
  if (issuesList.length > 0) {
    await updatePostedIssuesLists(context, issuesList);
  }
};
