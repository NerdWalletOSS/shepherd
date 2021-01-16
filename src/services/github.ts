/* eslint-disable class-methods-use-this */
import { Octokit } from '@octokit/rest';
import { RestEndpointMethodTypes } from '@octokit/plugin-rest-endpoint-methods'
import _ from 'lodash';
import netrc from 'netrc';

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

  public repoSearch(criteria: RestEndpointMethodTypes['search']['repos']['parameters']):
  Promise<RestEndpointMethodTypes['search']['repos']['response']> {
    return this.paginate(this.octokit.search.repos, criteria);
  }

  public codeSearch(criteria: RestEndpointMethodTypes['search']['code']['parameters']):
  Promise<RestEndpointMethodTypes['search']['code']['response']> {
    return this.paginate(this.octokit.search.code, criteria);
  }

  public getRepos(criteria: RestEndpointMethodTypes['repos']['get']['parameters']):
  Promise<RestEndpointMethodTypes['repos']['get']['response']> {
    return this.octokit.repos.get(criteria);
  }

  public listOrgRepos({ org }: RestEndpointMethodTypes['repos']['listForOrg']['parameters']):
  Promise<RestEndpointMethodTypes['repos']['listForOrg']['response']> {
    return this.paginate(this.octokit.repos.listForOrg, { org });
  }

  public async getActiveReposForOrg(criteria: RestEndpointMethodTypes['repos']['listForOrg']['parameters']):
  Promise<RestEndpointMethodTypes['repos']['listForOrg']['response']> {
    const allOrgRepos = await this.paginate(this.octokit.repos.listForOrg, { org: criteria.org });

    const unarchivedRepos = allOrgRepos.filter((r: any) => !r.archived);
    return unarchivedRepos.map((r: any) => r.full_name).sort();
  }

  public listPullRequests(criteria: RestEndpointMethodTypes['pulls']['list']['parameters']):
  Promise<RestEndpointMethodTypes['pulls']['list']['response']> {
    return this.paginate(this.octokit.pulls.list, criteria);
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
}

export default GithubService;
