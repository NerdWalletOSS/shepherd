import type { Octokit } from '@octokit/rest';

import { IMigrationContext } from '../migration-context';
import GithubService from '../services/github';
import GithubAdapter from './github';
jest.mock('../services/github');

const mockMigrationContext = () =>
  ({
    migration: {
      spec: {
        id: 'test-migration',
        title: 'Test migration',
      },
    },
  }) as IMigrationContext;

describe('GithubAdapter', () => {
  describe('reposEqual', () => {
    it('recognizes two repos as equal', () => {
      const mocktokit = {} as any as Octokit;
      const repo1 = { owner: 'NerdWallet', name: 'shepherd' };
      const repo2 = { owner: 'NerdWallet', name: 'shepherd' };

      const context = mockMigrationContext();
      const service = new GithubService(context, mocktokit);
      const adapter = new GithubAdapter(context, service);
      expect(adapter.reposEqual(repo1, repo2)).toBe(true);
    });

    it('recognizes two repos as equal if one is missing a default branch', () => {
      const mocktokit = {} as any as Octokit;
      const repo1 = { owner: 'NerdWallet', name: 'shepherd', defaultBranch: 'main' };
      const repo2 = { owner: 'NerdWallet', name: 'shepherd' };

      const context = mockMigrationContext();
      const service = new GithubService(context, mocktokit);
      const adapter = new GithubAdapter(context, service);
      expect(adapter.reposEqual(repo1, repo2)).toBe(true);
    });
  });

  describe('getCandidateRepos', () => {
    it('validates search_query is not specified with org search', () => {
      const mocktokit = {} as any as Octokit;
      const context = mockMigrationContext();
      context.migration.spec.adapter = {
        org: 'testOrg',
        type: 'github',
        search_query: 'topics:test',
      };

      const service = new GithubService(context, mocktokit);
      const adapter = new GithubAdapter(context, service);

      return expect(adapter.getCandidateRepos()).rejects.toThrow(
        'Cannot use both "org" and "search_query" in GitHub adapter. Pick one.'
      );
    });

    it('performs org search if specified and returns expected result', async () => {
      const mocktokit = {} as any as Octokit;
      const context = mockMigrationContext();
      context.migration.spec.adapter = {
        type: 'github',
        org: 'testOrg',
      };

      const service: any = new GithubService(context, mocktokit);
      service.getActiveReposForOrg.mockResolvedValue(['testOrg/test-repo']);

      const adapter = new GithubAdapter(context, service);

      const result = await adapter.getCandidateRepos();
      expect(service.getActiveReposForOrg).toHaveBeenCalledWith({ org: 'testOrg' });
      expect(result).toStrictEqual([{ owner: 'testOrg', name: 'test-repo' }]);
    });

    it(`performs repository search and returns expected result if 'respositories' is specified for search_type`, async () => {
      const mocktokit = {} as any as Octokit;
      const context = mockMigrationContext();
      context.migration.spec.adapter = {
        type: 'github',
        search_type: 'repositories',
        search_query: 'topics:test',
      };

      const service: any = new GithubService(context, mocktokit);
      service.getActiveReposForSearchTypeAndQuery.mockResolvedValue(['repoownername/test-repo']);

      const adapter = new GithubAdapter(context, service);

      const result = await adapter.getCandidateRepos();
      expect(service.getActiveReposForSearchTypeAndQuery).toHaveBeenCalledWith({
        search_type: 'repositories',
        search_query: 'topics:test',
      });
      expect(result).toStrictEqual([{ owner: 'repoownername', name: 'test-repo' }]);
    });

    it(`performs code search and returns expected result if search_type is 'code'`, async () => {
      const mocktokit = {} as any as Octokit;
      const context = mockMigrationContext();
      context.migration.spec.adapter = {
        type: 'github',
        search_type: 'code',
        search_query: 'path:/ filename:package.json in:path',
      };

      const service: any = new GithubService(context, mocktokit);
      service.getActiveReposForSearchTypeAndQuery.mockResolvedValue(['repoownername/test-repo']);
      const adapter = new GithubAdapter(context, service);

      const result = await adapter.getCandidateRepos();

      expect(service.getActiveReposForSearchTypeAndQuery).toHaveBeenCalledTimes(1);
      expect(service.getActiveReposForSearchTypeAndQuery).toHaveBeenCalledWith({
        search_type: 'code',
        search_query: 'path:/ filename:package.json in:path',
      });
      expect(result).toStrictEqual([{ owner: 'repoownername', name: 'test-repo' }]);
    });

    it(`performs code search and returns expected result if search_type is not provided`, async () => {
      const mocktokit = {} as any as Octokit;
      const context = mockMigrationContext();
      context.migration.spec.adapter = {
        type: 'github',
        search_query: 'path:/ filename:package.json in:path',
      };

      const service: any = new GithubService(context, mocktokit);
      service.getActiveReposForSearchTypeAndQuery.mockResolvedValue(['repoownername/test-repo']);
      const adapter = new GithubAdapter(context, service);

      const result = await adapter.getCandidateRepos();

      expect(service.getActiveReposForSearchTypeAndQuery).toHaveBeenCalledTimes(1);
      expect(service.getActiveReposForSearchTypeAndQuery).toHaveBeenCalledWith({
        search_type: 'code',
        search_query: 'path:/ filename:package.json in:path',
      });
      expect(result).toStrictEqual([{ owner: 'repoownername', name: 'test-repo' }]);
    });
  });

  describe('parseRepo', () => {
    it('throws if owner or name not found in repo string', () => {
      const context = mockMigrationContext();
      const mocktokit = {} as any as Octokit;
      const service = new GithubService(context, mocktokit);
      const adapter = new GithubAdapter(context, service);
      const calledWithoutName = adapter.parseRepo.bind(null, 'ownerbutnoname/');
      const calledWithoutOwner = adapter.parseRepo.bind(null, '/namebutnoowner');
      const calledWithNeither = adapter.parseRepo.bind(null, '');

      expect(calledWithoutName).toThrow('Could not parse repo "ownerbutnoname/"');
      expect(calledWithoutOwner).toThrow('Could not parse repo "/namebutnoowner"');
      expect(calledWithNeither).toThrow('Could not parse repo ""');
    });
  });

  describe('mapRepoAfterCheckout', () => {
    it('saves the default branch', async () => {
      const context = mockMigrationContext();
      const mocktokit = {} as any as Octokit;
      const service: any = new GithubService(context, mocktokit);
      const repo = {
        owner: 'NerdWallet',
        name: 'test',
      };
      service.getDefaultBranchForRepo.mockResolvedValue('develop');
      const adapter = new GithubAdapter(context, service);

      const mappedRepo = await adapter.mapRepoAfterCheckout(repo);
      expect(service.getDefaultBranchForRepo).toHaveBeenCalledTimes(1);
      expect(service.getDefaultBranchForRepo).toHaveBeenCalledWith({
        owner: repo.owner,
        repo: repo.name,
      });
      expect(mappedRepo).toEqual({
        ...repo,
        defaultBranch: 'develop',
      });
    });
  });

  describe('prRepo', () => {
    const REPO = {
      owner: 'NerdWallet',
      name: 'shepherd',
      defaultBranch: 'main',
    };

    it('creates a new PR if one does not exist', async () => {
      const context = mockMigrationContext();
      const octokit = {} as any as Octokit;
      const service: any = new GithubService(context, octokit);
      service.listPullRequests.mockResolvedValue([]);
      const adapter = new GithubAdapter(context, service);

      await adapter.createPullRequest(REPO, 'Test PR message', 'NerdWallet');

      expect(service.listPullRequests).toHaveBeenCalledWith({
        owner: 'NerdWallet',
        repo: 'shepherd',
        head: 'NerdWallet:test-migration',
      });
      expect(service.createPullRequest).toHaveBeenCalledWith({
        owner: 'NerdWallet',
        repo: 'shepherd',
        head: 'NerdWallet:test-migration',
        base: 'main',
        title: 'Test migration',
        body: 'Test PR message',
      });
    });

    it('updates a PR if one exists and is open', async () => {
      const context = mockMigrationContext();
      const octokit = {} as any as Octokit;
      const service: any = new GithubService(context, octokit);
      service.listPullRequests.mockResolvedValue([
        {
          number: 1234,
          state: 'open',
        },
      ]);
      const adapter = new GithubAdapter(context, service);
      await adapter.createPullRequest(REPO, 'Test PR message, part 2', 'NerdWallet');

      expect(service.updatePullRequest).toHaveBeenCalledWith({
        owner: 'NerdWallet',
        repo: 'shepherd',
        title: 'Test migration',
        body: 'Test PR message, part 2',
        pull_number: 1234,
      });
    });

    it('does not update a closed PR', async () => {
      const context = mockMigrationContext();
      const octokit = {} as any as Octokit;
      const service: any = new GithubService(context, octokit);
      service.listPullRequests.mockResolvedValue([
        {
          number: 1234,
          state: 'closed',
        },
      ]);
      const adapter = new GithubAdapter(context, service);
      await expect(
        adapter.createPullRequest(REPO, 'Test PR message, part 2', 'NerdWallet')
      ).rejects.toThrow();
      expect(service.updatePullRequest).not.toBeCalled();
    });
  });

  describe('getBaseBranch', () => {
    const context = mockMigrationContext();
    const mocktokit = {} as any as Octokit;
    const service = new GithubService(context, mocktokit);
    const adapter = new GithubAdapter(context, service);
    const repo = { owner: 'NerdWallet', name: 'shepherd', defaultBranch: 'main' };

    afterEach(() => {
      delete process.env.SHEPHERD_BASE_BRANCH;
    });

    it('returns SHEPHERD_BASE_BRANCH env var if set', () => {
      process.env.SHEPHERD_BASE_BRANCH = 'feature-branch';
      expect(adapter.getBaseBranch(repo)).toBe('feature-branch');
    });

    it('trims SHEPHERD_BASE_BRANCH env var', () => {
      process.env.SHEPHERD_BASE_BRANCH = '  develop  ';
      expect(adapter.getBaseBranch(repo)).toBe('develop');
    });

    it('returns repo.defaultBranch if SHEPHERD_BASE_BRANCH is not set', () => {
      expect(adapter.getBaseBranch(repo)).toBe('main');
    });
  });

  describe('getRepositoryUrl', () => {
    const context = mockMigrationContext();
    const octokit = {} as any as Octokit;
    const service: any = new GithubService(context, octokit);
    const adapter = new GithubAdapter(context, service);
    const repo = {
      owner: 'NerdWallet',
      name: 'shepherd',
    };

    beforeAll(() => {
      process.env.SHEPHERD_GITHUB_ENTERPRISE_BASE_URL = 'github.com';
    });

    afterAll(() => {
      delete process.env.SHEPHERD_GITHUB_ENTERPRISE_BASE_URL;
    });

    it('returns the SSH URL, when not given a protocol', () => {
      delete process.env.SHEPHERD_GITHUB_PROTOCOL;
      expect(adapter['getRepositoryUrl'](repo)).toBe('git@github.com:NerdWallet/shepherd.git');
    });

    it('returns the SSH URL, when given protocol=ssh', () => {
      process.env.SHEPHERD_GITHUB_PROTOCOL = 'ssh';
      expect(adapter['getRepositoryUrl'](repo)).toBe('git@github.com:NerdWallet/shepherd.git');
    });

    it('returns the HTTPS URL when given protocol=https', () => {
      process.env.SHEPHERD_GITHUB_PROTOCOL = 'https';
      expect(adapter['getRepositoryUrl'](repo)).toBe('https://github.com/NerdWallet/shepherd.git');
    });

    it('throws on unexpected protocols', () => {
      process.env.SHEPHERD_GITHUB_PROTOCOL = 'not-a-protocol';
      expect(() => adapter['getRepositoryUrl'](repo)).toThrow(
        "Unknown protocol not-a-protocol. Valid values are 'ssh' and 'https'"
      );
    });
  });

  describe('getBaseBranch', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      jest.resetModules();
      process.env = { ...originalEnv };
    });

    afterAll(() => {
      process.env = originalEnv;
    });

    it('returns the repo defaultBranch when SHEPHERD_BASE_BRANCH is not set', () => {
      const mocktokit = {} as any as Octokit;
      const context = mockMigrationContext();
      const service = new GithubService(context, mocktokit);
      const adapter = new GithubAdapter(context, service);
      const repo = { owner: 'NerdWallet', name: 'shepherd', defaultBranch: 'main' };
      delete process.env.SHEPHERD_BASE_BRANCH;

      expect(adapter.getBaseBranch(repo)).toBe('main');
    });

    it('returns the environment variable value when SHEPHERD_BASE_BRANCH is set', () => {
      const mocktokit = {} as any as Octokit;
      const context = mockMigrationContext();
      const service = new GithubService(context, mocktokit);
      const adapter = new GithubAdapter(context, service);
      const repo = { owner: 'NerdWallet', name: 'shepherd', defaultBranch: 'main' };
      process.env.SHEPHERD_BASE_BRANCH = 'develop';

      expect(adapter.getBaseBranch(repo)).toBe('develop');
    });

    it('returns an empty string when SHEPHERD_BASE_BRANCH is an empty string', () => {
      const mocktokit = {} as any as Octokit;
      const context = mockMigrationContext();
      const service = new GithubService(context, mocktokit);
      const adapter = new GithubAdapter(context, service);
      const repo = { owner: 'NerdWallet', name: 'shepherd', defaultBranch: 'main' };
      process.env.SHEPHERD_BASE_BRANCH = '';

      expect(adapter.getBaseBranch(repo)).toBe('');
    });
  });
});
