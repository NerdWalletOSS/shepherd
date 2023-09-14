/* eslint-disable class-methods-use-this */
import { Octokit } from '@octokit/rest';
import { retry } from '@octokit/plugin-retry';
import type { RestEndpointMethodTypes } from '@octokit/plugin-rest-endpoint-methods';
import { throttling } from '@octokit/plugin-throttling';
import _ from 'lodash';
import netrc from 'netrc';

import { IMigrationContext } from '../migration-context';

const RetryableThrottledOctokit = Octokit.plugin(throttling, retry);

interface SearchTypeAndQueryParams {
  search_type: 'repositories' | 'code';
  search_query: string;
}

export default class GithubService {
  private octokit: Octokit;

  constructor(context: IMigrationContext, octokit?: Octokit) {
    if (octokit) {
      this.octokit = octokit;
    } else {
      const netrcAuth = netrc();
      const token =
        process.env.GITHUB_TOKEN || _.get(netrcAuth['api.github.com'], 'password', undefined);

      if (!token) {
        throw new Error(`No Github credentials found; set either GITHUB_TOKEN or
        set a token on the 'password' field in ~/.netrc for api.github.com`);
      }

      this.octokit = new RetryableThrottledOctokit({
        auth: token,
        throttle: {
          onRateLimit: (retryAfter: number, options: any) => {
            context.logger.warn(`Hit rate limit for ${options.method} ${options.url}`);
            context.logger.warn(`Retrying in ${retryAfter} second(s)`);
            return options.request.retryCount < 5;
          },
          onAbuseLimit: (retryAfter: number, options: any) => {
            context.logger.warn(`Hit abuse limit for ${options.method} ${options.url}`);
            context.logger.warn(`Retrying in ${retryAfter} second(s)`);
            return options.request.retryCount < 5;
          },
        },
      });
    }
  }

  private paginateRest(method: any, criteria: any) {
    return this.octokit.paginate(method, criteria);
  }

  private async findReposByMetadata(
    criteria: RestEndpointMethodTypes['search']['repos']['parameters']
  ): Promise<string[]> {
    const searchResults: RestEndpointMethodTypes['search']['repos']['response']['data']['items'] =
      await this.paginateRest(this.octokit.search.repos, criteria);

    return searchResults.map((r) => _.get(r, 'full_name')).sort();
  }

  private async findReposByCode(
    criteria: RestEndpointMethodTypes['search']['code']['parameters']
  ): Promise<RestEndpointMethodTypes['search']['code']['response']['data']['items']> {
    return this.paginateRest(this.octokit.search.code, criteria);
  }

  private getRepo(
    criteria: RestEndpointMethodTypes['repos']['get']['parameters']
  ): Promise<RestEndpointMethodTypes['repos']['get']['response']> {
    return this.octokit.repos.get(criteria);
  }

  private listOrgRepos({
    org,
  }: RestEndpointMethodTypes['repos']['listForOrg']['parameters']): Promise<
    RestEndpointMethodTypes['repos']['listForOrg']['response']['data']
  > {
    return this.paginateRest(this.octokit.repos.listForOrg, { org });
  }

  public async getDefaultBranchForRepo(
    criteria: RestEndpointMethodTypes['repos']['get']['parameters']
  ): Promise<string> {
    const { data } = await this.getRepo(criteria);
    return data.default_branch;
  }

  public async getActiveReposForOrg(
    criteria: RestEndpointMethodTypes['repos']['listForOrg']['parameters']
  ): Promise<string[]> {
    const allOrgRepos = await this.listOrgRepos({ org: criteria.org });

    return allOrgRepos
      .filter((r) => !r.archived)
      .map((r) => r.full_name)
      .sort();
  }

  public getPullRequest(
    criteria: RestEndpointMethodTypes['pulls']['get']['parameters']
  ): Promise<RestEndpointMethodTypes['pulls']['get']['response']> {
    return this.octokit.pulls.get(criteria);
  }

  public listPullRequests(
    criteria: RestEndpointMethodTypes['pulls']['list']['parameters']
  ): Promise<RestEndpointMethodTypes['pulls']['list']['response']['data']> {
    return this.paginateRest(this.octokit.pulls.list, criteria);
  }

  public createPullRequest(
    criteria: RestEndpointMethodTypes['pulls']['create']['parameters']
  ): Promise<RestEndpointMethodTypes['pulls']['create']['response']> {
    return this.octokit.pulls.create(criteria);
  }

  public updatePullRequest(
    criteria: RestEndpointMethodTypes['pulls']['update']['parameters']
  ): Promise<RestEndpointMethodTypes['pulls']['update']['response']> {
    return this.octokit.pulls.update(criteria);
  }

  public getCombinedRefStatus(
    criteria: RestEndpointMethodTypes['repos']['getCombinedStatusForRef']['parameters']
  ): Promise<RestEndpointMethodTypes['repos']['getCombinedStatusForRef']['response']> {
    return this.octokit.repos.getCombinedStatusForRef(criteria);
  }

  public getBranch(
    criteria: RestEndpointMethodTypes['repos']['getBranch']['parameters']
  ): Promise<RestEndpointMethodTypes['repos']['getBranch']['response']> {
    return this.octokit.repos.getBranch(criteria);
  }

  public async getActiveReposForSearchTypeAndQuery({
    search_type,
    search_query,
  }: SearchTypeAndQueryParams): Promise<string[]> {
    switch (search_type) {
      case 'repositories': {
        return this.findReposByMetadata({ q: search_query });
      }
      case 'code': {
        const repos = await this.findReposByCode({ q: search_query });
        const archived = await Promise.all(
          repos.map(async (r) => {
            const {
              owner: { login: owner },
              name,
            } = r.repository;
            const { data } = await this.getRepo({ owner, repo: name });
            return data.archived;
          })
        );
        return repos.filter((_r, i) => !archived[i]).map((r) => r.repository.full_name);
      }
      default: {
        throw new Error(`Invalid search_type: ${search_type}`);
      }
    }
  }
}
