const { exec } = require('child-process-promise');

module.exports = async (adapter, repo, command) => {
  const repoDir = await adapter.getRepoDir(repo);
  const dataDir = await adapter.getDataDir(repo);
  const execOptions = {
    cwd: repoDir,
    env: {
      ...process.env,
      REPO_DIR: repoDir,
      DATA_DIR: dataDir,
    },
  };
  await exec(command, execOptions);
};
