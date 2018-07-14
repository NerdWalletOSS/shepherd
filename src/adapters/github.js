const path = require('path');
const fs = require('fs-extra');
const simpleGit = require('simple-git/promise');
const { isEqual } = require('lodash');

class GithubAdapter {
  constructor(migrationContext) {
    this.migrationContext = migrationContext;
  }

  async getCandidateRepos() {
    return [{
      owner: 'NerdWallet',
      name: 'shepherd',
    }];
  }

  parseSelectedRepo(repo) {
    const [owner, name] = repo.split('/');
    if (!owner || !name) {
      throw new Error(`Could not parse repo "${repo}"`);
    }
    return { owner, name };
  }

  async filterRepos(repos, selectedRepos) {
    return repos.filter(repo => selectedRepos.find(r => isEqual(repo, r)));
  }

  async checkoutRepo(repo) {
    const repoPath = `git@github.com:${repo.owner}/${repo.name}.git`;
    const localPath = await this.getRepoDir(repo);

    if (await fs.exists(localPath) && await simpleGit(localPath).checkIsRepo()) {
      // Repo already exists; just fetch
      simpleGit(localPath).fetch('origin');
    } else {
      await simpleGit().clone(repoPath, localPath);
    }
  }

  async getRepoDir(repo) {
    return path.join(this.migrationContext.migration.workingDirectory, 'repos', repo.owner, repo.name);
  }

  async getDataDir(repo) {
    return path.join(this.migrationContext.migration.workingDirectory, 'data', repo.owner, repo.name);
  }
};

module.exports = GithubAdapter;
