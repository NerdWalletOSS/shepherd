import type { Octokit } from '@octokit/rest';

import { IMigrationContext } from '../migration-context';
import GithubAdapter from './github';

const mockMigrationContext = () => ({
  migration: {
    spec: {
      id: 'test-migration',
      title: 'Test migration'
    },
  },
});

// const noOpOnRetry = () => { /* do-nothing onRetry fn for mocks */ }

describe('GithubAdapter', () => {
  describe('reposEqual', () => {
    it('recognizes two repos as equal', () => {
      const repo1 = { owner: 'NerdWallet', name: 'shepherd' };
      const repo2 = { owner: 'NerdWallet', name: 'shepherd' };
      const adapter = new GithubAdapter(mockMigrationContext() as IMigrationContext, {} as Octokit);
      expect(adapter.reposEqual(repo1, repo2)).toBe(true);
    });

    it('recognizes two repos as equal if one is missing a default branch', () => {
      const repo1 = { owner: 'NerdWallet', name: 'shepherd', defaultBranch: 'master' };
      const repo2 = { owner: 'NerdWallet', name: 'shepherd' };
      const adapter = new GithubAdapter(mockMigrationContext() as IMigrationContext, {} as Octokit);
      expect(adapter.reposEqual(repo1, repo2)).toBe(true);
    });
  });

  describe('getCandidateRepos', () => {
    it('validates search_type option if provided', async () => {
      const mocktokit = ({
        repos: {
          get: jest.fn().mockReturnValue({
            data: {
              default_branch: 'develop',
            },
          }),
        },
        search: {}
      } as any as Octokit);

      const migrationCtx: any = mockMigrationContext();
      migrationCtx.migration.spec.adapter = {
        type: 'github',
        search_type: 'invalid_search_type'
      };

      const adapter = new GithubAdapter(migrationCtx, mocktokit);

      try {
        await adapter.getCandidateRepos();
      } catch (e) {
        expect(e.message).toContain(`"search_type" must be one of the following:`);
      }
    });

    it(`performs repository search and returns expected result if 'respositories' is specified for search_type`, async () => {
      const mockApiResult: object[] = [{
        full_name: 'repoownername/test-repo'
      }];

      const mocktokit = ({
        paginate: jest
          .fn()
          .mockResolvedValue(mockApiResult),
        search: {
          repos: jest.fn().mockReturnValue({
            data: {
              items: [{
                full_name: 'repoownername/test-repo'
              }]
            }
          })
        }
      } as any);

      const migrationCtx: any = mockMigrationContext();
      migrationCtx.migration.spec.adapter = {
        type: 'github',
        search_type: 'repositories',
        search_query: 'topics:test'
      };

      const adapter = new GithubAdapter(migrationCtx, mocktokit as Octokit);

      const result = await adapter.getCandidateRepos();
      expect(mocktokit.paginate.mock.calls.length).toBe(1);
      expect(mocktokit.paginate.mock.calls[0][1]).toStrictEqual({ q: 'topics:test' });
      expect(result).toStrictEqual([ { owner: 'repoownername', name: 'test-repo' } ]);
    });

    it(`performs code search and returns expected result if search_type is 'code' or is not provided`, async () => {
      const mockApiResult: object[] = [{
        repository: {
          full_name: 'repoownername/test-repo'
        }
      }];

      const mocktokit = ({
        paginate: jest
          .fn()
          .mockResolvedValue(mockApiResult),
        search: {
          code: jest.fn().mockReturnValue({
            data: {
              items: [{
                full_name: 'repoownername/test-repo'
              }]
            }
          })
        }
      } as any);

      const migrationCtx: any = mockMigrationContext();
      migrationCtx.migration.spec.adapter = {
        type: 'github',
        search_type: 'code',
        search_query: 'path:/ filename:package.json in:path'
      };

      const migrationCtxWithoutSearchType: any = mockMigrationContext();
      migrationCtxWithoutSearchType.migration.spec.adapter = {
        type: 'github',
        search_query: 'path:/ filename:package.json in:path'
      };

      const adapterWithSearchType = new GithubAdapter(migrationCtx, mocktokit as Octokit);
      const adapterWithoutSearchType = new GithubAdapter(migrationCtxWithoutSearchType, mocktokit as Octokit);

      const getCandidateRepos = [
        adapterWithSearchType.getCandidateRepos(),
        adapterWithoutSearchType.getCandidateRepos()
      ];

      const results = await Promise.all(getCandidateRepos);
      expect(mocktokit.paginate.mock.calls.length).toBe(2);
      expect(mocktokit.paginate.mock.calls[0][1]).toStrictEqual({ q: 'path:/ filename:package.json in:path' });
      expect(mocktokit.paginate.mock.calls[1][1]).toStrictEqual({ q: 'path:/ filename:package.json in:path' });
      expect(results[0]).toStrictEqual([ { owner: 'repoownername', name: 'test-repo' } ]);      
      expect(results[1]).toStrictEqual([ { owner: 'repoownername', name: 'test-repo' } ]);      
    });
  });

  describe('mapRepoAfterCheckout', () => {
    it('saves the default branch', async () => {
      const mocktokit = ({
        repos: {
          get: jest.fn().mockReturnValue({
            data: {
              default_branch: 'develop',
            },
          }),
        },
      } as any as Octokit);

      const adapter = new GithubAdapter(mockMigrationContext() as IMigrationContext, mocktokit);
      const repo = {
        owner: 'NerdWallet',
        name: 'test',
      };
      const mappedRepo = await adapter.mapRepoAfterCheckout(repo);
      expect(mappedRepo).toEqual({
        ...repo,
        defaultBranch: 'develop',
      });
    });
  });

  describe('prRepo', () => {
    const mockPrOctokit = (existingPr: any): Octokit => ({
      pulls: {
        list: jest.fn().mockReturnValue(existingPr),
        create: jest.fn(),
        update: jest.fn(),
      },
      repos: {
        get: jest.fn().mockReturnValue({
          data: {
            default_branch: 'master',
          },
        }),
      },
    } as any as Octokit);

    const REPO = {
      owner: 'NerdWallet',
      name: 'shepherd',
      defaultBranch: 'master',
    };

    it('creates a new PR if one does not exist', async () => {
      const octokit = mockPrOctokit({ data: [] });
      const adapter = new GithubAdapter(mockMigrationContext() as IMigrationContext, octokit);
      await adapter.createPullRequest(REPO, 'Test PR message');

      const listMock = octokit.pulls.list;
      const createMock = octokit.pulls.create;
      expect(listMock).toBeCalled();
      expect(createMock).toBeCalledWith({
        owner: 'NerdWallet',
        repo: 'shepherd',
        head: 'test-migration',
        base: 'master',
        title: 'Test migration',
        body: 'Test PR message',
      });
    });

    it('updates a PR if one exists and is open', async () => {
      const octokit = mockPrOctokit({
        data: [{
          number: 1234,
          state: 'open',
        }],
      });
      const adapter = new GithubAdapter(mockMigrationContext() as IMigrationContext, octokit);
      await adapter.createPullRequest(REPO, 'Test PR message, part 2');
      const updateMock = octokit.pulls.update;

      expect(updateMock).toBeCalledWith({
        owner: 'NerdWallet',
        repo: 'shepherd',
        pull_number: 1234,
        title: 'Test migration',
        body: 'Test PR message, part 2',
      });
    });

    it('does not update a closed PR', async () => {
      const octokit = mockPrOctokit({
        data: [{
          number: 1234,
          state: 'closed',
        }],
      });
      const adapter = new GithubAdapter(mockMigrationContext() as IMigrationContext, octokit);
      await expect(adapter.createPullRequest(REPO, 'Test PR message, part 2')).rejects.toThrow();
      const updateMock = octokit.pulls.update;
      expect(updateMock).not.toBeCalled();
    });
  });
});
