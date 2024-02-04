import { IMigrationContext } from '../migration-context';
import forEachRepo from '../util/for-each-repo';
import { IssueTracker } from '../adapters/base';
import { getIssueListsFromTracker, updatePostedIssuesLists } from '../util/persisted-data';

export default async (context: IMigrationContext) => {
  const {
    adapter,
    logger,
    migration: { spec },
  } = context;
  try {
    const issuesList: IssueTracker[] = await getIssueListsFromTracker(context);
    logger.spinner('Fetched the issue lists');

    await forEachRepo(context, async (repo) => {
       logger.spinner('Posting an issue');

        const issueNumber = issuesList
          .find((issue) => issue.repo === repo.name)
          ?.issueNumber?.toString();

        if (issueNumber) {
          await adapter.updateIssue(repo, issueNumber);
          issuesList
            .filter((issueFromTracker) => issueFromTracker.issueNumber === issueNumber)
            .map((specificIssue) => (specificIssue.title = spec?.issues?.title));
          logger.spinner(`Issue updated issueNumber# ${issueNumber} for repo ${repo.name}`);
        } else {
          const issueNumber: any = await adapter.createIssue(repo);
          issuesList.push({
            issueNumber,
            title: spec?.issues?.title,
            owner: repo.owner,
            repo: repo.name,
          });
          logger.spinner('Issue created');
        }
    });
    //Add the opened issues with issue_number and repo in the issue_tracker.json
    if (issuesList.length > 0) {
      await updatePostedIssuesLists(context, issuesList);
    }
  } catch (e: any) {
    logger.error("Error to post/update issue");
    logger.spinner('Failed to post/update an issue');
  }
};
