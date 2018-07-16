const yaml = require('js-yaml');
const path = require('path');
const fs = require('fs');

const getRepoListFile = migrationContext => path.join(migrationContext.migration.workingDirectory, 'repos.yml');

const loadRepoList = (migrationContext) => {
  const repoListFile = getRepoListFile(migrationContext);
  if (!fs.existsSync(repoListFile)) {
    return null;
  }
  return yaml.safeLoad(fs.readFileSync(repoListFile, 'utf8'));
};

const updateRepoList = (migrationContext, checkedOutRepos, discardedRepos) => {
  // We need to keep the list of repos in sync with what's actually on disk
  // To do this, we'll load the existing list, delete any repos that were not
  // kept during the checkout process (perhaps they failed a new should_migrate check),
  // and add any repos that were newly checked out, removing duplicates as appropriate
  const existingRepos = loadRepoList(migrationContext);
  if (!existingRepos) {
    // No repos stored yet, we can update this list directly
    fs.writeFileSync(getRepoListFile(migrationContext), yaml.safeDump(checkedOutRepos));
    return checkedOutRepos;
  }
  const { adapter } = migrationContext.migration;
  const filteredRepos = existingRepos.filter(r => !discardedRepos.find(r2 => adapter.reposEqual(r, r2)));
  for (const repo of checkedOutRepos) {
    if (!filteredRepos.find(r => adapter.reposEqual(repo, r))) {
      filteredRepos.push(repo);
    }
  }
  return filteredRepos;
};

module.exports = {
  updateRepoList,
  loadRepoList,
};
