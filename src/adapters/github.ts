/* eslint-disable class-methods-use-this */
import Octokit from '@octokit/rest';
import chalk from 'chalk';
import { isEqual } from 'lodash';
import netrc from 'netrc';
import path from 'path';

import { IMigrationContext } from '../migration-context';
import { paginateSearch } from '../util/octokit';
import { IRepo } from './base';
import GitAdapter from './git';

class GithubAdapter extends GitAdapter {
  private octokit: Octokit;

  /**
   * Constructs a new GitHub adapter. The second parameter allows for
   * dependency injection during testing. If an Octokit instance is not
   * provided, one will be created and authenticated automatically.
   */
  constructor(migrationContext: IMigrationContext, octokit?: Octokit) {
    super(migrationContext);
    this.migrationContext = migrationContext;

    if (octokit) {
      this.octokit = octokit;
    } else {
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
  }

  public async getCandidateRepos(): Promise<IRepo[]> {
    const searchResults = await paginateSearch(this.octokit, this.octokit.search.code)({
      q: this.migrationContext.migration.spec.adapter.search_query,
    });
    return searchResults.map((r: any) => this.parseRepo(r.repository.full_name)).sort();
  }

  public parseRepo(repo: string): IRepo {
    const [owner, name] = repo.split('/');
    if (!owner || !name) {
      throw new Error(`Could not parse repo "${repo}"`);
    }
    return { owner, name };
  }

  public reposEqual(repo1: IRepo, repo2: IRepo): boolean {
    return isEqual(repo1, repo2);
  }

  public stringifyRepo({ owner, name }: IRepo): string {
    return `${owner}/${name}`;
  }

  public async createPullRequest(repo: IRepo, message: string): Promise<void> {
    const { migration: { spec } } = this.migrationContext;
    const { owner, name } = repo;
    // We need to figure out the "default" branch to create a pull request
    const githubRepo = await this.octokit.repos.get({
      owner,
      repo: name,
    });

    // Let's check if a PR already exists
    const { data: pullRequests } = await this.octokit.pullRequests.getAll({
      owner,
      repo: name,
      head: `${owner}:${this.branchName}`,
    });

    if (pullRequests && pullRequests.length) {
      // A PR likely already exists - let's assume we can update it
      await this.octokit.pullRequests.update({
        owner,
        repo: name,
        number: pullRequests[0].number,
        title: spec.title,
        body: message,
      });
    } else {
      // No PR yet - we have to create it
      await this.octokit.pullRequests.create({
        owner,
        repo: name,
        head: this.branchName,
        base: githubRepo.data.default_branch,
        title: spec.title,
        body: message,
      });
    }
  }

  public async getPullRequestStatus(repo: IRepo): Promise<string[]> {
    const { owner, name } = repo;
    const status: string[] = [];

    // First, check for a pull request
    const pullRequests = await this.octokit.pullRequests.getAll({
      owner,
      repo: name,
      head: `${owner}:${this.branchName}`,
    });

    if (pullRequests.data && pullRequests.data.length) {
      // GitHub's API is weird - you need a second query to get information about mergeability
      const { data: pullRequest } = await this.octokit.pullRequests.get({
        owner,
        repo: name,
        number: pullRequests.data[0].number,
      });

      status.push(`PR #${pullRequest.number} [${pullRequest.html_url}]`);
      if (pullRequest.merged_at) {
        status.push(`PR was merged at ${pullRequest.merged_at}`);
      } else if (pullRequest.mergeable && pullRequest.mergeable_state === 'clean') {
        status.push(chalk.green('PR is mergeable!'));
      } else {
        status.push(chalk.red('PR is not mergeable'));
        // Let's see what's blocking us
        // Sadly, we can only get information about failing status checks, not being blocked
        // by things like required reviews
        const combinedStatus = await this.octokit.repos.getCombinedStatusForRef({
          owner,
          repo: name,
          ref: this.branchName,
        });

        const { statuses } = combinedStatus.data;
        const anyPending = statuses.some((s: any) => s.state === 'pending');
        const anyFailing = statuses.some((s: any) => s.state === 'error' || s.state === 'failure');

        const recordStatus = (s: any) => status.push(`${s.context} ${chalk.dim(`- ${s.description}`)}`);

        if (anyPending) {
          status.push(chalk.underline.yellow('Pending status checks'));
          statuses.forEach((s: any) => {
            if (s.state !== 'pending') {
              return;
            }
            recordStatus(s);
          });
        }

        if (anyFailing) {
          status.push(chalk.underline.red('Failing status checks'));
          statuses.forEach((s: any) => {
            if (!(s.state === 'error' || s.state === 'failure')) {
              return;
            }
            recordStatus(s);
          });
        }
      }
    } else {
      try {
        // This will throw an exception if the branch does not exist
        await this.octokit.repos.getBranch({
          owner,
          repo: name,
          branch: this.branchName,
        });
        status.push('No PR exists');
      } catch (e) {
        if (e.code === 404) {
          status.push('No branch or PR exists');
        } else {
          throw e;
        }
      }
    }

    return status;
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
