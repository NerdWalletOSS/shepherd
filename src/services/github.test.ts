import type { Octokit } from '@octokit/rest';
import GithubService from './github';

describe('GithubService', () => {
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
              listForOrg: () => { return null; },
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

  describe('updatePullRequest', () => {
    it('calls pulls.update with provided criteria & returns results', async () => {
        const prUpdateResponse = {
            url: 'https://api.github.com/repos/testOrg/test-repo/pulls/1',
            id: 1,
            html_url: 'https://github.com/testOrg/test-repo/pull/1'
        };

        const mocktokit = {
            pulls: {
              update: jest.fn().mockResolvedValue(prUpdateResponse),
            },
        } as any as Octokit;

        const service = new GithubService(mocktokit);
        const prUpdateParams = {
            owner: 'testOrg',
            repo: 'test-repo',
            pull_number: 1,
            title: 'feat: some feature',
            body: 'Update: still the best PR ever',
        };
        const result = await service.updatePullRequest(prUpdateParams);

        expect(mocktokit.pulls.update).toBeCalledWith(prUpdateParams);
        expect(result).toEqual(prUpdateResponse);        
    });
  });

  describe('getCombinedRefStatus', () => {
    it('calls repos.getCombinedStatusForRef with provided criteria & returns results', async () => {
        const combinedRefStatusResponse = {
            data: {
                state: 'open',
                statuses: {
                    state: 'pending'
                }    
            }
        };

        const mocktokit = {
            repos: {
              getCombinedStatusForRef: jest.fn().mockResolvedValue(combinedRefStatusResponse)
            }
        } as any as Octokit;

        const service = new GithubService(mocktokit);
        const criteria = {
            owner: 'testOrg',
            repo: 'test-repo',
            ref: 'mass-update',
        };
        const result = await service.getCombinedRefStatus(criteria);

        expect(mocktokit.repos.getCombinedStatusForRef).toBeCalledWith(criteria);
        expect(result).toEqual(combinedRefStatusResponse);
    });
  });

  describe('getBranch', () => {
    it('calls repos.getBranch with provided criteria & returns results', async () => {
        const branchResponse = {
            name: 'mass-update',
            commit: {
                url: 'https://github.com/testOrg/test-repo/tree/mass-update'
            }
        };

        const mocktokit = {
            repos: {
              getBranch: jest.fn().mockResolvedValue(branchResponse)
            }
        } as any as Octokit;

        const service = new GithubService(mocktokit);
        const criteria = {
            owner: 'testOrg',
            repo: 'test-repo',
            branch: 'mass-update',
        };
        const result = await service.getBranch(criteria);

        expect(mocktokit.repos.getBranch).toBeCalledWith(criteria);
        expect(result).toEqual(branchResponse);
    });
  });

  describe('getActiveReposForSearchTypeAndQuery', () => {
    it('validates search_type is valid & throws if not', async () => {
        const mocktokit = {} as any as Octokit;

        const service = new GithubService(mocktokit);
        const criteria = {
            search_type: 'invalid_search_type',
            search_query: 'any'
        };
        const fn = service.getActiveReposForSearchTypeAndQuery.bind(service, criteria);

        expect(fn).toThrowError(`"search_type" must be one of the following:
        'code' | 'repositories'`);
    });

    it('finds repos by metadata if repository search is specified & returns results', async () => {
        const repoSearchResponse = [
            {
                name: 'repo1',
                full_name: 'testOrg/repo1',
            },
            {
                name: 'repo2',
                full_name: 'testOrg/repo2',
            }
        ]
        const mocktokit = {
            paginate: jest.fn().mockResolvedValue(repoSearchResponse),
            search: {
                repos: jest.fn()
            }
        } as any as Octokit;

        const service = new GithubService(mocktokit);
        const criteria = {
            search_type: 'repositories',
            search_query: 'topics:test'
        };

        const result = await service.getActiveReposForSearchTypeAndQuery(criteria);

        expect(mocktokit.paginate).toBeCalledWith(mocktokit.search.repos, { q: criteria.search_query });
        expect(result).toEqual(repoSearchResponse.map((o) => o.full_name));
    });

    it('finds repos by code if code search specified or search type omitted & returns results', async () => {
        const codeSearchResponse = [
            {
                name: 'package.json',
                repository: {
                    name: 'repo1',
                    full_name: 'testOrg/repo1',
                },
    
            },
            {
                name: 'package.json',
                repository: {
                    name: 'repo2',
                    full_name: 'testOrg/repo2',
                },
            }
        ];

        const mocktokit = {
            paginate: jest.fn().mockResolvedValue(codeSearchResponse),
            search: {
                code: jest.fn()
            }
        } as any as Octokit;

        const service = new GithubService(mocktokit);
        const criteria1 = {
            search_type: 'code',
            search_query: 'org:testOrg path:/ filename:package.json in:path'
        };

        const criteria2 = {
            search_query: 'org:testOrg path:/ filename:package.json in:path'
        };

        const results = await Promise.all([
            service.getActiveReposForSearchTypeAndQuery(criteria1),
            service.getActiveReposForSearchTypeAndQuery(criteria2)
        ]);

        expect(mocktokit.paginate).toBeCalledWith(mocktokit.search.code, { q: criteria1.search_query });
        expect(mocktokit.paginate).toBeCalledWith(mocktokit.search.code, { q: criteria2.search_query });
        expect(results[0]).toEqual(codeSearchResponse.map((o) => o.repository.full_name ));
        expect(results[1]).toEqual(codeSearchResponse.map((o) => o.repository.full_name ));
    });
  });
});
