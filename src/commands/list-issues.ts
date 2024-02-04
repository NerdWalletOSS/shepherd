import { IMigrationContext } from '../migration-context';
import { getIssueTrackerFile } from '../util/persisted-data';
import fs from 'fs-extra';
import { table } from 'table';

export default async (context: IMigrationContext) => {

  const rows: any = [];

  const columns = ['issue Number', 'issue Title', 'Owner', 'Repo Name'];

  const issuesList = JSON.parse(await fs.readFile(getIssueTrackerFile(context), 'utf8'));

  for (let i = 0; i < issuesList.length; i++){
    const issue: any = issuesList[i];
    rows.push([issue.issueNumber, issue.title, issue.owner, issue.repo]);
  }

  process.stdout.write(table([columns, ...rows]));
};
