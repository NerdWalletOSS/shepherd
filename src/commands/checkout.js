module.exports = async (context) => {
  const {
    migration: { selectedRepos },
    adapter,
  } = context;

  const repos = selectedRepos || await adapter.getCandidateRepos();

  console.log(`Cloning ${repos.length} repos`);
  for (const repo of repos) { // eslint-disable-line no-restricted-syntax
    await adapter.checkoutRepo(repo); // eslint-disable-line no-await-in-loop
  }
};
