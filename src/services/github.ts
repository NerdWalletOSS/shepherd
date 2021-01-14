/* eslint-disable class-methods-use-this */
import { Octokit } from '@octokit/rest';
import { OctokitResponse } from '@octokit/types';
import { RestEndpointMethodTypes } from '@octokit/plugin-rest-endpoint-methods'
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

class GithubService {
  private octokit: Octokit;

  constructor(octokit?: Octokit) {
    if (octokit) {
      this.octokit = octokit;
    } else {
      const netrcAuth = netrc();
      const token = process.env.GITHUB_TOKEN || _.get(netrcAuth['api.github.com'], 'password', undefined);

      if (!token) {
        throw new Error(`No Github credentials found; set either GITHUB_TOKEN or 
        set a token on the 'password' field in ~/.netrc for api.github.com`);
      }

      this.octokit = new Octokit({
        auth: token
      });  
    }
  }

  public paginate(method: any, criteria: any) {
    return this.octokit.paginate(method, criteria);
  }

  public async repoSearch(criteria: RestEndpointMethodTypes['search']['repos']) {

  }

  public async codeSearch(criteria: RestEndpointMethodTypes['search']['code']) {

  }

  public getRepos(criteria: RestEndpointMethodTypes['repos']['get']) {
    return this.octokit.repos.get(criteria);
  }

  public listOrgRepos(criteria: RestEndpointMethodTypes['repos']['listForOrg']): Promise<any> {
    return this.paginate(this.octokit.repos.listForOrg, criteria);
  }

  public listPullRequests(criteria: RestEndpointMethodTypes['pulls']['list']) {
    return this.paginate(this.octokit.pulls.list, criteria);
  }

  public updatePullRequest(criteria: RestEndpointMethodTypes['pulls']['update']) {
    return this.octokit.pulls.update(criteria);
  }

  public createPullRequest(criteria: RestEndpointMethodTypes['pulls']['create']) {
    return this.octokit.pulls.create(criteria);
  }

  public getCombinedRefStatus(criteria: RestEndpointMethodTypes['repos']['getCombinedStatusForRef']) {
    return this.octokit.repos.getCombinedStatusForRef(criteria);
  }

  public getBranch(criteria: RestEndpointMethodTypes['repos']['getBranch']) {
    return this.octokit.repos.getBranch(criteria);
  }
}

export default GithubService;
