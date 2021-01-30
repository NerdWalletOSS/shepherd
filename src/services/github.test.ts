import type { Octokit } from '@octokit/rest';
import GithubServie from './github';

describe('GithubService', () => {
//   describe('paginateRest', () => {
//     it('calls paginateRest with provided method and criteria', () => {
//     });
//   });

//   describe('findReposByMetadata', () => {
//     it('', () => {
//     });
//   });

//   describe('findReposByCode', () => {
//     it('recognizes two repos as equal', () => {
//     });
//   });

//   describe('getRepos', () => {
//     it('calls octokit.repos.get & returns provided results', () => {
        // const octokit = new Octokit();
        // const mocktokit = ({} as any as Octokit);
//     });
//   });

  describe('getDefaultBranchForRepo', () => {
    it('calls repos.get with provided criteria & returns default branch', async () => {
        const mocktokit = {
            repos: {
              get: jest.fn().mockResolvedValue({
                data: {
                  default_branch: 'master',
                },
              }),
            },
        } as any as Octokit;
        const service = new GithubServie(mocktokit);
        const searchCriteria = {
            owner: 'NerdwalletOSS',
            repo: 'shepherd',
        };
        const result = await service.getDefaultBranchForRepo(searchCriteria);
        
        expect(mocktokit.repos.get).toBeCalledWith(searchCriteria)
        expect(result).toEqual('master');
    });
  });

//   describe('listOrgRepos', () => {
//     it('calls paginateRest & returns results provided', () => {
//     });
//   });

//   describe('getActiveReposForOrg', () => {
//     it('calls paginateRest & returns sorted key from returned object', () => {
//     });
//   });

//   describe('getPullRequest', () => {
//     it('calls get with provided criteria & returns results', () => {
//     });
//   });

//   describe('listPullRequests', () => {
//     it('calls paginateRest with provided criteria & returns results', () => {
//     });
//   });

//   describe('createPullRequest', () => {
//     it('calls pulls.create with provided criteria & returns results', () => {
//     });
//   });

//   describe('updatePullRequest', () => {
//     it('calls pulls.update with provided criteria & returns results', () => {
//     });
//   });

//   describe('getCombinedRefStatus', () => {
//     it('calls repos.getCombinedStatusForRef with provided criteria & returns results', () => {
//     });
//   });

//   describe('getBranch', () => {
//     it('calls repos.getBranch with provided criteria & returns results', () => {
//     });
//   });

//   describe('getActiveReposForSearchTypeAndQuery', () => {
//     it('validates search_type is valid', () => {
//     });

//     it('finds repos by metadata if repository search is specified & returns results', () => {
//     });

//     it('finds repos by code if code search specified or search type omitted & returns results', () => {
//     });
//   });
});
