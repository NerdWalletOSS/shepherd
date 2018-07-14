const simpleGit = require('simple-git');

module.exports = async (context, options) => {
  const {
    shepherd: {
      workingDirectory: shepherdWorkingDirectory,
    },
    migration: {
      name: migrationName,
      workingDirectory: migrationWorkingDirectory,
      selectedRepos,
    },
    adapter
  } = context;

  const repos = selectedRepos || await adapter.getCandidateRepos();

  console.log(`Cloning ${repos.length} repos`);
  console.log(repos);
  for (const repo of repos) {
    await adapter.checkoutRepo(repo);
  }
};
