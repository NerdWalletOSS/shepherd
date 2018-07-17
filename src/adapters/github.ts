/* eslint-disable class-methods-use-this */
import path from 'path';
import fs from 'fs-extra-promise';
import simpleGit from 'simple-git/promise';
import { isEqual } from 'lodash';
import netrc from 'netrc';
const octokit = require('@octokit/rest')();

import BaseAdapter, { Repo } from './base';
import { MigrationContext } from '../migration-context';
const { paginateSearch } = require('../util/octokit');

class GithubAdapter extends BaseAdapter {
  constructor(migrationContext: MigrationContext) {
    super(migrationContext);

    // Authenticate for future GitHub requests
    const netrcAuth = netrc();
    octokit.authenticate({
      type: 'basic',
      username: netrcAuth['api.github.com'].login,
      password: netrcAuth['api.github.com'].password,
    });
  }

  async getCandidateRepos(): Promise<Array<Repo>> {
    const searchResults: Array<any> = await paginateSearch(octokit.search.code)({
      q: this.migrationContext.migration.spec.search_query,
    });
    return searchResults.map(r => this.parseSelectedRepo(r.repository.full_name));
  }

  parseSelectedRepo(repo: string): Repo {
    const [owner, name] = repo.split('/');
    if (!owner || !name) {
      throw new Error(`Could not parse repo "${repo}"`);
    }
    return { owner, name };
  }

  reposEqual(repo1: Repo, repo2: Repo): boolean {
    return isEqual(repo1, repo2);
  }

  formatRepo({ owner, name }: Repo): string {
    return `${owner}/${name}`;
  }

  async checkoutRepo(repo: Repo): Promise<void> {
    const repoPath = `git@github.com:${repo.owner}/${repo.name}.git`;
    const localPath = await this.getRepoDir(repo);

    if (await fs.existsAsync(localPath) && await simpleGit(localPath).checkIsRepo()) {
      // Repo already exists; just fetch
      await simpleGit(localPath).fetch('origin');
    } else {
      await simpleGit().clone(repoPath, localPath);
    }
  }

  async getRepoDir(repo: Repo): Promise<string> {
    return path.join(this.migrationContext.migration.workingDirectory, 'repos', repo.owner, repo.name);
  }

  async getDataDir(repo: Repo): Promise<string> {
    return path.join(this.migrationContext.migration.workingDirectory, 'data', repo.owner, repo.name);
  }
}

export default GithubAdapter;
