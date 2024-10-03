import fs from 'fs-extra';
import { load } from 'js-yaml';
import _ from 'lodash';
const { differenceWith, unionWith } = _;
import path from 'path';

import { IRepo } from '../adapters/base.js';
import { IMigrationContext } from '../migration-context.js';

const jsonStringify = (data: any) => JSON.stringify(data, undefined, 2);

/**
 * This is to support people who started using Shepherd before we switched to
 * storing state in JSON. It'll read an existing YAML file, write it to a JSON
 * file, and delete the old YAML file.
 */
const migrateToJsonIfNeeded = async (migrationContext: IMigrationContext) => {
  const legacyFile = getLegacyRepoListFile(migrationContext);
  if (await fs.pathExists(legacyFile)) {
    const data = load(await fs.readFile(legacyFile, 'utf8'));
    await fs.outputFile(getRepoListFile(migrationContext), jsonStringify(data));
    await fs.remove(legacyFile);
  }
};

const getRepoListFile = (migrationContext: IMigrationContext) => {
  return path.join(migrationContext.migration.workingDirectory, 'repos.json');
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

export { updateRepoList, loadRepoList };
