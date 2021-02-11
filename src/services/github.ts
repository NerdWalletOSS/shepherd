/* eslint-disable class-methods-use-this */
import { Octokit } from '@octokit/rest';
import { RestEndpointMethodTypes } from '@octokit/plugin-rest-endpoint-methods'
import _ from 'lodash';
import netrc from 'netrc';

const VALID_SEARCH_TYPES: ReadonlyArray<string> = ['code', 'repositories'] as const;

interface SearchTypeAndQueryParams { 
  search_type?: string
  search_query: string
}

export default class GithubService {
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

  private paginateRest(method: any, criteria: any) {
    return this.octokit.paginate(method, criteria);
  }

  private async findReposByMetadata(criteria: RestEndpointMethodTypes['search']['repos']['parameters']): Promise<string[]> {
    const searchResults: RestEndpointMethodTypes['search']['repos']['response']['data']['items'] =
    await this.paginateRest(this.octokit.search.repos, criteria);

    return searchResults.map((r) => _.get(r, 'full_name')).sort();
  }

  private async findReposByCode(criteria: RestEndpointMethodTypes['search']['code']['parameters']): Promise<string[]> {
    const searchResults: RestEndpointMethodTypes['search']['code']['response']['data']['items'] =
    await this.paginateRest(this.octokit.search.code, criteria);

    return searchResults.map((r) => _.get(r, 'repository.full_name')).sort();
  }

  private getRepos(criteria: RestEndpointMethodTypes['repos']['get']['parameters']):
  Promise<RestEndpointMethodTypes['repos']['get']['response']> {
    return this.octokit.repos.get(criteria);
  }

  private listOrgRepos({ org }: RestEndpointMethodTypes['repos']['listForOrg']['parameters']):
  Promise<RestEndpointMethodTypes['repos']['listForOrg']['response']['data']> {
    return this.paginateRest(this.octokit.repos.listForOrg, { org });
  }

  public async getDefaultBranchForRepo(criteria: RestEndpointMethodTypes['repos']['get']['parameters']):
  Promise<string> {
    const { data } = await this.getRepos(criteria);
    return data.default_branch;
  }

  public async getActiveReposForOrg(criteria: RestEndpointMethodTypes['repos']['listForOrg']['parameters']):
  Promise<string[]> {
    const allOrgRepos = await this.listOrgRepos({ org: criteria.org });

    return allOrgRepos
      .filter((r) => !r.archived)
      .map((r) => r.full_name)
      .sort();
  }

  public getPullRequest(criteria: RestEndpointMethodTypes['pulls']['get']['parameters']):
  Promise<RestEndpointMethodTypes['pulls']['get']['response']> {
    return this.octokit.pulls.get(criteria);
  }

  public listPullRequests(criteria: RestEndpointMethodTypes['pulls']['list']['parameters']):
  Promise<RestEndpointMethodTypes['pulls']['list']['response']['data']> {
    return this.paginateRest(this.octokit.pulls.list, criteria);
  }

  public createPullRequest(criteria: RestEndpointMethodTypes['pulls']['create']['parameters']):
  Promise<RestEndpointMethodTypes['pulls']['create']['response']> {
    return this.octokit.pulls.create(criteria);
  }

  public updatePullRequest(criteria: RestEndpointMethodTypes['pulls']['update']['parameters']):
  Promise<RestEndpointMethodTypes['pulls']['update']['response']> {
    return this.octokit.pulls.update(criteria);
  }

  public getCombinedRefStatus(criteria: RestEndpointMethodTypes['repos']['getCombinedStatusForRef']['parameters']):
  Promise<RestEndpointMethodTypes['repos']['getCombinedStatusForRef']['response']> {
    return this.octokit.repos.getCombinedStatusForRef(criteria);
  }

  public getBranch(criteria: RestEndpointMethodTypes['repos']['getBranch']['parameters']):
  Promise<RestEndpointMethodTypes['repos']['getBranch']['response']> {
    return this.octokit.repos.getBranch(criteria);
  }

  public getActiveReposForSearchTypeAndQuery({ search_type, search_query }: SearchTypeAndQueryParams): 
  Promise<any> {
    if (search_type && !VALID_SEARCH_TYPES.includes(search_type)) {
      throw new Error(`"search_type" must be one of the following:
        ${VALID_SEARCH_TYPES.map(e => `'${e}'`).join(' | ')}`);
    }

    switch (search_type) {
      case 'repositories':
        return this.findReposByMetadata({ q: search_query });
      case 'code':
      default:
        return this.findReposByCode({ q: search_query });
    } 
  }
}
