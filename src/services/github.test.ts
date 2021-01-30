import type { Octokit } from '@octokit/rest';
// import { RestEndpointMethodTypes } from '@octokit/plugin-rest-endpoint-methods'
import GithubService from './github';

describe('GithubService', () => {
//   describe('octokit.paginate', () => {
//     it('calls octokit.paginate with provided method and criteria', () => {
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

//   describe.only('listOrgRepos', () => {
//     it('calls octokit.paginate with criteria & returns results provided', async () => {
//         const orgRepos = [{
//             archived: true,
//             full_name: 'testOrg/archived-repo'
//         }, {
//             archived: false,
//             full_name: 'testOrg/active-repo'
//         }];

//         const mocktokit = {
//             paginate: jest.fn().mockResolvedValue(orgRepos),
//             repos: {
//               listForOrg: () => {},
//               get: jest.fn().mockResolvedValue({
//                 data: {
//                   default_branch: 'master',
//                 },
//               }),
//             },
//         } as any as Octokit;

//         const service = new GithubService(mocktokit);
//         const searchCriteria = { org: 'testOrg' };
//         const result = await service.listOrgRepos(searchCriteria);

//         expect(mocktokit.paginate).toBeCalledWith(mocktokit.repos.listForOrg, searchCriteria)
//         expect(result).toEqual('testOrg/active-repo');
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
        const service = new GithubService(mocktokit);
        const searchCriteria = {
            owner: 'NerdwalletOSS',
            repo: 'shepherd',
        };
        const result = await service.getDefaultBranchForRepo(searchCriteria);
        
        expect(mocktokit.repos.get).toBeCalledWith(searchCriteria)
        expect(result).toEqual('master');
    });
  });

  describe('getActiveReposForOrg', () => {
    it('calls octokit.paginate with criteria & returns sorted list of active repos', async () => {
        const orgRepos = [
            {
                archived: true,
                full_name: 'testOrg/archived-repo'
            },
            {
                archived: false,
                full_name: 'testOrg/very-active-repo'
            },
            {
                archived: false,
                full_name: 'testOrg/active-repo'
            }
        ];

        const mocktokit = {
            paginate: jest.fn().mockResolvedValue(orgRepos),
            repos: {
              listForOrg: () => {},
              get: jest.fn().mockResolvedValue({
                data: {
                  default_branch: 'master',
                },
              }),
            },
        } as any as Octokit;

        const service = new GithubService(mocktokit);
        const searchCriteria = { org: 'testOrg' };
        const result = await service.getActiveReposForOrg(searchCriteria);

        expect(mocktokit.paginate).toBeCalledWith(mocktokit.repos.listForOrg, searchCriteria)
        expect(result).toEqual(['testOrg/active-repo', 'testOrg/very-active-repo']);
    });
  });

  describe('getPullRequest', () => {
    it('calls pulls.get with provided criteria & returns results', async () => {
        const samplePRResponse = {
            data: {
                number: 1,
                html_url: 'https://github.com/testOrg/test-repo',
                merged_at: null,
                mergable: true,
                mergable_state: 'clean'
            }
        };

        const mocktokit = {
            pulls: {
              get: jest.fn().mockResolvedValue(samplePRResponse),
            },
        } as any as Octokit;

        const service = new GithubService(mocktokit);
        const searchCriteria = {
            owner: 'testOrg',
            repo: 'test-repo',
            pull_number: 1,
        };
        const result = await service.getPullRequest(searchCriteria);

        expect(mocktokit.pulls.get).toBeCalledWith(searchCriteria);
        expect(result).toEqual(samplePRResponse);
    });
  });

  describe('listPullRequests', () => {
    it('calls octokit.paginate with provided criteria & returns results', async () => {
        const samplePRsResponse = [
            {
                number: 1,
            },
            {
                number: 2
            }
        ];

        const mocktokit = {
            paginate: jest.fn().mockResolvedValue(samplePRsResponse),
            pulls: {
              list: jest.fn(),
            },
        } as any as Octokit;

        const service = new GithubService(mocktokit);
        const searchCriteria: any = {
            owner: 'testOrg',
            repo: 'test-repo',
            head: 'testOrg:branch1',
            state: 'all',
        };
        const result = await service.listPullRequests(searchCriteria);

        expect(mocktokit.paginate).toBeCalledWith(mocktokit.pulls.list, searchCriteria);
        expect(result).toEqual(samplePRsResponse);
    });
  });

  describe('createPullRequest', () => {
    it('calls pulls.create with provided criteria & returns results', async () => {
        const prCreateResponse = {
            url: 'https://api.github.com/repos/testOrg/test-repo/pulls/1',
            id: 1,
            html_url: 'https://github.com/testOrg/test-repo/pull/1'
        };

        const mocktokit = {
            pulls: {
              create: jest.fn().mockResolvedValue(prCreateResponse),
            },
        } as any as Octokit;

        const service = new GithubService(mocktokit);
        const prCreateParams = {
            owner: 'testOrg',
            repo: 'test-repo',
            head: 'shepherd-1',
            base: 'master',
            title: 'feat: some feature',
            body: 'This is the best PR ever',
        };
        const result = await service.createPullRequest(prCreateParams);

        expect(mocktokit.pulls.create).toBeCalledWith(prCreateParams);
        expect(result).toEqual(prCreateResponse);
    });
  });

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
