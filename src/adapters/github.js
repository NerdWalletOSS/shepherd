/* eslint-disable class-methods-use-this */
const path = require('path');
const fs = require('fs-extra');
const simpleGit = require('simple-git/promise');
const { isEqual } = require('lodash');
const netrc = require('netrc');
const octokit = require('@octokit/rest')();
const { paginateSearch } = require('../util/octokit');

class GithubAdapter {
  constructor(migrationContext) {
    this.migrationContext = migrationContext;

    // Authenticate for future GitHub requests
    const netrcAuth = netrc();
    octokit.authenticate({
      type: 'basic',
      username: netrcAuth['api.github.com'].login,
      password: netrcAuth['api.github.com'].password,
    });
  }

  async getCandidateRepos() {
    const searchResults = await paginateSearch(octokit.search.code)({
      q: this.migrationContext.migration.spec.search_query,
    });
    return searchResults.map(r => this.parseSelectedRepo(r.repository.full_name));
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

  formatRepo({ owner, name }) {
    return `${owner}/${name}`;
  }

  async checkoutRepo(repo) {
    const repoPath = `git@github.com:${repo.owner}/${repo.name}.git`;
    const localPath = await this.getRepoDir(repo);

    if (await fs.exists(localPath) && await simpleGit(localPath).checkIsRepo()) {
      // Repo already exists; just fetch
      await simpleGit(localPath).fetch('origin');
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
}

module.exports = GithubAdapter;
