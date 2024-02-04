import { IMigrationContext } from '../migration-context.js';
import { getIssueTrackerFile } from '../util/persisted-data.js';
import fs from 'fs-extra';

import Table = require('cli-table');

export default async (context: IMigrationContext) => {
  const table = new Table({
    head: ['issue Number', 'issue Title', 'Owner', 'Repo Name'],
    colWidths: [50, 50, 50, 50],
  });

  const { logger } = context;
  const issuesList = JSON.parse(await fs.readFile(getIssueTrackerFile(context), 'utf8'));

  issuesList.forEach((issue: any) => {
    table.push([issue.issueNumber, issue.title, issue.owner, issue.repo]);
  });

  logger.info(table.toString());
};