/* eslint-disable class-methods-use-this */
import { RestEndpointMethods } from '@octokit/plugin-rest-endpoint-methods/dist-types/generated/method-types';
import { Octokit } from '@octokit/rest';
import chalk from 'chalk';
import _ from 'lodash';
import netrc from 'netrc';
import path from 'path';

import { IMigrationContext } from '../migration-context';
import { IEnvironmentVariables, IRepo } from './base';
import GitAdapter from './git';

const VALID_SEARCH_TYPES = ['code', 'repositories'] as const;

enum SafetyStatus {
  Success,
  PullRequestExisted,
  NonShepherdCommits,
}

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
      const netrcAuth = netrc();
      const token = process.env.GITHUB_TOKEN || _.get(netrcAuth['api.github.com'], 'login', undefined);

      if (!token) {
        throw new Error(`No Github credentials found; set either GITHUB_TOKEN or 
        set a token on the 'login' field in ~/.netrc for api.github.com`);
      }

      this.octokit = new Octokit({
        auth: token
      });  
    }
  }

  public async getCandidateRepos(): Promise<IRepo[]> {
    const { org, search_type, search_query } = this.migrationContext.migration.spec.adapter;
    let repoNames: string[] = [];

    // list all of an orgs repos
    if (org) {
      if (search_query) {
        throw new Error('Cannot use both "org" and "search_query" in GitHub adapter. Pick one.');
      }

      const repos = await this.octokit.paginate(this.octokit.repos.listForOrg, { org })
      const unarchivedRepos = repos.filter((r: any) => !r.archived);
      repoNames = unarchivedRepos.map((r: any) => r.full_name).sort();
    } else {
      if (search_type && !VALID_SEARCH_TYPES.includes(search_type)) {
        throw new Error(`"search_type" must be one of the following: 
          ${VALID_SEARCH_TYPES.map(e => `'${e}'`).join(' | ')}`);
      }

      let searchMethod:
        RestEndpointMethods['search']['repos'] |
        RestEndpointMethods['search']['code'];
      let fullNamePath: string;

      switch (search_type) {
        case 'repositories':
          searchMethod = this.octokit.search.repos
          fullNamePath = 'full_name'
          break;
        case 'code':
        default:
          searchMethod = this.octokit.search.code // github code search query. results are less reliable
          fullNamePath = 'repository.full_name'
      }

      const searchResults: string[] = await this.octokit.paginate(
        searchMethod,
        { q: search_query },
        (r: any) => r.items
      )
      repoNames = searchResults.map((r) => _.get(r, fullNamePath)).sort();
    }

    return _.uniq(repoNames).map((r: any) => this.parseRepo(r));
  }

  public async mapRepoAfterCheckout(repo: Readonly<IRepo>): Promise<IRepo> {
    const { owner, name } = repo;
    const { data } = await this.octokit.repos.get({
      owner,
      repo: name,
    });
    return {
      ...repo,
      defaultBranch: data.default_branch,
    };
  }

  public parseRepo(repo: string): IRepo {
    const [owner, name] = repo.split('/');
    if (!owner || !name) {
      throw new Error(`Could not parse repo "${repo}"`);
    }
    return { owner, name };
  }

  public reposEqual(repo1: IRepo, repo2: IRepo): boolean {
    // GitHub ignores case when differentiating organizations and repos, so we
    // can safely use a case-insensitive compare to make things slightly easier
    // for users who might be using a case-insensitive name on the command line.
    return (
      repo1.owner.toLowerCase() === repo2.owner.toLowerCase() &&
      repo1.name.toLowerCase() === repo2.name.toLowerCase()
    );
  }

  public stringifyRepo({ owner, name }: IRepo): string {
    return `${owner}/${name}`;
  }

  public async resetRepoBeforeApply(repo: IRepo, force: boolean) {
    const { defaultBranch } = repo;
    // First, get any changes from the remote
    // --prune will ensure that any remote branch deletes are reflected here
    await this.git(repo).fetch(['origin', '--prune']);

    if (!force) {
      const safetyStatus = await this.checkActionSafety(repo);
      if (safetyStatus === SafetyStatus.PullRequestExisted) {
        throw new Error('Remote branch did not exist, but a pull request does or did; try with --force-reset-branch?');
      } else if (safetyStatus === SafetyStatus.NonShepherdCommits) {
        throw new Error('Found non-Shepherd commits on remote branch; try with --force-reset-branch?');
      }
    }

    // If we got this far, we can go ahead and reset to the default branch
    await this.git(repo).reset(['--hard', `origin/${defaultBranch}`]);
  }

  public async pushRepo(repo: IRepo, force: boolean): Promise<void> {
    let shouldForce = false;

    // First, get any changes from the remote
    // --prune will ensure that any remote branch deletes are reflected here
    await this.git(repo).fetch(['origin', '--prune']);

    if (!force) {
      const safetyStatus = await this.checkActionSafety(repo);
      if (safetyStatus === SafetyStatus.PullRequestExisted) {
        throw new Error('Remote branch did not exist, but a pull request does or did; try with --force?');
      } else if (safetyStatus === SafetyStatus.NonShepherdCommits) {
        throw new Error('Found non-Shepherd commits on remote branch; try with --force?');
      }

      // If we get to here, it's safe to force-push to this branch
      shouldForce = true;
    }

    await super.pushRepo(repo, force || shouldForce);
  }

  public async createPullRequest(repo: IRepo, message: string): Promise<void> {
    const { migration: { spec } } = this.migrationContext;
    const { owner, name, defaultBranch } = repo;

    // Let's check if a PR already exists
    const { data: pullRequests } = await this.octokit.pulls.list({
      owner,
      repo: name,
      head: `${owner}:${this.branchName}`,
    });

    if (pullRequests && pullRequests.length) {
      const pullRequest = pullRequests[0];

      if (pullRequest.state === 'open') {
        // A pull request exists and is open, let's update it
        await this.octokit.pulls.update({
          owner,
          repo: name,
          pull_number: pullRequest.number,
          title: spec.title,
          body: message,
        });
      } else {
        // A pull request exists but it was already closed - don't update it
        // TODO proper status reporting without errors
        throw new Error('Could not update pull request; it was already closed');
      }
    } else {
      // No PR yet - we have to create it
      await this.octokit.pulls.create({
        owner,
        repo: name,
        head: this.branchName,
        base: defaultBranch,
        title: spec.title,
        body: message,
      });
    }
  }

  public async getPullRequestStatus(repo: IRepo): Promise<string[]> {
    const { owner, name } = repo;
    const status: string[] = [];

    // First, check for a pull request
    const { data: pullRequests } = await this.octokit.pulls.list({
      owner,
      repo: name,
      head: `${owner}:${this.branchName}`,
      state: 'all',
    });

    if (pullRequests && pullRequests.length) {
      // GitHub's API is weird - you need a second query to get information about mergeability
      const { data: pullRequest } = await this.octokit.pulls.get({
        owner,
        repo: name,
        pull_number: pullRequests[0].number,
      });

      status.push(`PR #${pullRequest.number} [${pullRequest.html_url}]`);
      if (pullRequest.merged_at) {
        status.push(chalk.magenta(`PR was merged at ${pullRequest.merged_at}`));
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

  public getBaseBranch(repo: IRepo): string {
    return repo.defaultBranch;
  }

  public async getEnvironmentVariables(repo: IRepo): Promise<IEnvironmentVariables> {
    const superEnvVars = await super.getEnvironmentVariables(repo);

    return {
      ...superEnvVars,
      SHEPHERD_GITHUB_REPO_OWNER: repo.owner,
      SHEPHERD_GITHUB_REPO_NAME: repo.name,
    };
  }

  protected getRepositoryUrl(repo: IRepo): string {
    return `git@github.com:${repo.owner}/${repo.name}.git`;
  }

  private async checkActionSafety(repo: IRepo): Promise<SafetyStatus> {
    const { owner, name } = repo;

    // Get all branches and look for the remote branch
    // @ts-ignore (typings are broken)
    const { branches } = await this.git(repo).branch();
    if (branches[`remotes/origin/${this.branchName}`] === undefined) {
      // This remote branch does not exist
      // We need to figure out if that's because a PR was open and
      // subsequently closed, or if it's because we just haven't pushed
      // a branch yet
      const pullRequests = await this.octokit.paginate(this.octokit.pulls.list, {
        owner,
        repo: name,
        head: `${owner}:${this.branchName}`,
        state: 'all',
      });

      if (pullRequests && pullRequests.length) {
        // We'll assume that if a remote branch does not exist but a PR
        // does/did, we don't want to apply to this branch
        return SafetyStatus.PullRequestExisted;
      }
    } else {
      // The remote branch exists!
      // We'll get the list of all commits not on master and check if they're
      // all from Shepherd. If they are, it's safe to reset the branch to
      // master.
      const upstreamBranch = `remotes/origin/${this.branchName}`;
      const commits = await this.git(repo).log([`HEAD..${upstreamBranch}`]);
      const allShepherd = commits.all.every(({ message }) => this.isShepherdCommitMessage(message));
      if (!allShepherd) {
        // RIP.
        return SafetyStatus.NonShepherdCommits;
      }
    }

    return SafetyStatus.Success;
  }
}

export default GithubAdapter;
