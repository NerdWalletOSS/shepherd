import yaml from 'js-yaml';
import path from 'path';
import fs from 'fs';

import { MigrationContext } from '../migration-context';
import { Repo } from '../adapters/base';

const getRepoListFile = (migrationContext: MigrationContext) => path.join(migrationContext.migration.workingDirectory, 'repos.yml');

const loadRepoList = (migrationContext: MigrationContext) => {
  const repoListFile = getRepoListFile(migrationContext);
  if (!fs.existsSync(repoListFile)) {
    return null;
  }
  return yaml.safeLoad(fs.readFileSync(repoListFile, 'utf8'));
};

const updateRepoList = (migrationContext: MigrationContext, checkedOutRepos: Array<Repo>, discardedRepos: Array<Repo>) => {
  // We need to keep the list of repos in sync with what's actually on disk
  // To do this, we'll load the existing list, delete any repos that were not
  // kept during the checkout process (perhaps they failed a new should_migrate check),
  // and add any repos that were newly checked out, removing duplicates as appropriate
  const existingRepos: Array<Repo> = loadRepoList(migrationContext);
  if (!existingRepos) {
    // No repos stored yet, we can update this list directly
    fs.writeFileSync(getRepoListFile(migrationContext), yaml.safeDump(checkedOutRepos));
    return checkedOutRepos;
  }
  const { adapter } = migrationContext;
  const filteredRepos = existingRepos.filter(r => !discardedRepos.find(r2 => adapter.reposEqual(r, r2)));
  for (const repo of checkedOutRepos) {
    if (!filteredRepos.find(r => adapter.reposEqual(repo, r))) {
      filteredRepos.push(repo);
    }
  }
  return filteredRepos;
};

export {
  updateRepoList,
  loadRepoList,
};
