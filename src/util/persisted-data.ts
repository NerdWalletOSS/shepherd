import fs from 'fs-extra';
import yaml from 'js-yaml';
import { differenceWith, unionWith } from 'lodash';
import path from 'path';

import { IRepo, issueTracker } from '../adapters/base';
import { IMigrationContext } from '../migration-context';

const jsonStringify = (data: any) => JSON.stringify(data, undefined, 2);

/**
 * This is to support people who started using Shepherd before we switched to
 * storing state in JSON. It'll read an existing YAML file, write it to a JSON
 * file, and delete the old YAML file.
 */
const migrateToJsonIfNeeded = async (migrationContext: IMigrationContext) => {
  const legacyFile = getLegacyRepoListFile(migrationContext);
  if (await fs.pathExists(legacyFile)) {
    const data = yaml.load(await fs.readFile(legacyFile, 'utf8'));
    await fs.outputFile(getRepoListFile(migrationContext), jsonStringify(data));
    await fs.remove(legacyFile);
  }
};

const getRepoListFile = (migrationContext: IMigrationContext) => {
  return path.join(migrationContext.migration.workingDirectory, 'repos.json');
};

const getIssueTrackerFile = (migrationContext: IMigrationContext) => {
  return path.join(migrationContext.migration.workingDirectory, 'issue_tracker.json');
};

const getLegacyRepoListFile = (migrationContext: IMigrationContext) => {
  return path.join(migrationContext.migration.workingDirectory, 'repos.yml');
};

const loadRepoList = async (migrationContext: IMigrationContext): Promise<IRepo[] | null> => {
  await migrateToJsonIfNeeded(migrationContext);
  const repoListFile = getRepoListFile(migrationContext);
  if (!(await fs.pathExists(repoListFile))) {
    return null;
  }
  return JSON.parse(await fs.readFile(repoListFile, 'utf8'));
};

const updateRepoList = async (
  migrationContext: IMigrationContext,
  checkedOutRepos: IRepo[],
  discardedRepos: IRepo[]
): Promise<IRepo[]> => {
  // We need to keep the list of repos in sync with what's actually on disk
  // To do this, we'll load the existing list, delete any repos that were not
  // kept during the checkout process (perhaps they failed a new should_migrate check),
  // and add any repos that were newly checked out, removing duplicates as appropriate
  const existingRepos = await loadRepoList(migrationContext);
  if (!existingRepos) {
    // No repos stored yet, we can update this list directly
    await fs.outputFile(getRepoListFile(migrationContext), JSON.stringify(checkedOutRepos));
    return checkedOutRepos;
  }

  const { reposEqual } = migrationContext.adapter;
  const repos = unionWith(
    differenceWith(existingRepos, discardedRepos, reposEqual),
    checkedOutRepos,
    reposEqual
  );

  await fs.outputFile(getRepoListFile(migrationContext), JSON.stringify(repos));
  return repos;
};

const updatePostedIssuesLists = async (
  migrationContext: IMigrationContext,
  issuePostedRepos: IRepo[]
): Promise<void> => {
  const issueTrackerFile = getIssueTrackerFile(migrationContext);
  //write all posted issues with issue number in the issue_tracker.json
  if (!(await fs.pathExists(issueTrackerFile))) {
    return await fs.outputFile(issueTrackerFile, JSON.stringify(issuePostedRepos));
  }
  const issueTracker: issueTracker[] = JSON.parse(await fs.readFile(issueTrackerFile, 'utf8'));
  issueTracker.push(...issuePostedRepos);

  return await fs.outputFile(issueTrackerFile, JSON.stringify(issueTracker));
};

const getIssueNumberForRepo = async (
  migrationContext: IMigrationContext,
  repo: string
): Promise<any> => {
  const issueTrackerFile = getIssueTrackerFile(migrationContext);
  if (!(await fs.pathExists(issueTrackerFile))) {
    return null;
  }
  const issueTracker: issueTracker[] = JSON.parse(await fs.readFile(issueTrackerFile, 'utf8'));
  // read the issue number from the issue tracker for each repo
  return issueTracker
    .filter((issue) => issue.repo === repo)
    .map((specificRepo) => specificRepo.issueNumber);
};

export { updateRepoList, loadRepoList, updatePostedIssuesLists, getIssueNumberForRepo };
