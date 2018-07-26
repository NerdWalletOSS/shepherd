/* eslint-disable class-methods-use-this */
import Octokit from '@octokit/rest';
import { isEqual } from 'lodash';
import netrc from 'netrc';
import path from 'path';

import { IMigrationContext } from '../migration-context';
import { paginateSearch } from '../util/octokit';
import { IRepo } from './base';
import GitAdapter from './git';

class GithubAdapter extends GitAdapter {
  private octokit: Octokit;

  constructor(migrationContext: IMigrationContext) {
    super(migrationContext);
    this.migrationContext = migrationContext;
    this.branchName = migrationContext.migration.spec.id;

    this.octokit = new Octokit();
    // We'll first try to auth with a token, then with .netrc
    if (process.env.GITHUB_TOKEN) {
      this.octokit.authenticate({
        type: 'oauth',
        token: process.env.GITHUB_TOKEN,
      });
    } else {
      const netrcAuth = netrc();
      // TODO: we could probably fail gracefully if there's no GITHUB_TOKEN
      // and also no .netrc credentials
      this.octokit.authenticate({
        type: 'basic',
        username: netrcAuth['api.github.com'].login,
        password: netrcAuth['api.github.com'].password,
      });
    }
  }

  public async getCandidateRepos(): Promise<IRepo[]> {
    const searchResults = await paginateSearch(this.octokit, this.octokit.search.code)({
      q: this.migrationContext.migration.spec.search_query,
    });
    return searchResults.map((r: any) => this.parseSelectedRepo(r.repository.full_name)).sort();
  }

  public parseSelectedRepo(repo: string): IRepo {
    const [owner, name] = repo.split('/');
    if (!owner || !name) {
      throw new Error(`Could not parse repo "${repo}"`);
    }
    return { owner, name };
  }

  public reposEqual(repo1: IRepo, repo2: IRepo): boolean {
    return isEqual(repo1, repo2);
  }

  public formatRepo({ owner, name }: IRepo): string {
    return `${owner}/${name}`;
  }

  public async prRepo(repo: IRepo, message: string): Promise<void> {
    const { migration: { spec } } = this.migrationContext;
    const { owner, name } = repo;
    // We need to figure out the "default" branch to create a pull request
    const githubRepo = await this.octokit.repos.get({
      owner,
      repo: name,
    });
    await this.octokit.pullRequests.create({
      owner,
      repo: name,
      head: this.branchName,
      base: githubRepo.data.default_branch,
      title: spec.title,
      body: message,
    });
  }

  public getRepoDir(repo: IRepo): string {
    return path.join(this.migrationContext.migration.workingDirectory, 'repos', repo.owner, repo.name);
  }

  public getDataDir(repo: IRepo): string {
    return path.join(this.migrationContext.migration.workingDirectory, 'data', repo.owner, repo.name);
  }

  protected getRepositoryUrl(repo: IRepo): string {
    return `git@github.com:${repo.owner}/${repo.name}.git`;
  }
}

export default GithubAdapter;
