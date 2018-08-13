import Octokit from '@octokit/rest';

import { IMigrationContext } from '../migration-context';
import GithubAdapter from './github';

const mockMigrationContext = () => ({
  migration: {
    spec: {
      id: 'test-migration',
      title: 'Test migration',
    },
  },
});

describe('GithubAdapter', () => {
  describe('prRepo', () => {
    const mockPrOctokit = (existingPr: any): Octokit => ({
      pullRequests: {
        getAll: jest.fn().mockReturnValue(existingPr),
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
    };

    it('creates a new PR if one does not exist', async () => {
      const octokit = mockPrOctokit({ data: [] });
      const adapter = new GithubAdapter(mockMigrationContext() as IMigrationContext, octokit);
      await adapter.createPullRequest(REPO, 'Test PR message');
      const createMock: jest.Mock = octokit.pullRequests.create as jest.Mock;
      expect(createMock).toBeCalledWith({
        owner: 'NerdWallet',
        repo: 'shepherd',
        head: 'test-migration',
        base: 'master',
        title: 'Test migration',
        body: 'Test PR message',
      });
    });

    it('updates an existing open PR', async () => {
      const octokit = mockPrOctokit({
        data: [{
          number: 1234,
          state: 'open',
        }],
      });
      const adapter = new GithubAdapter(mockMigrationContext() as IMigrationContext, octokit);
      await adapter.createPullRequest(REPO, 'Test PR message, part 2');
      const updateMock: jest.Mock = octokit.pullRequests.update as jest.Mock;
      expect(updateMock).toBeCalledWith({
        owner: 'NerdWallet',
        repo: 'shepherd',
        number: 1234,
        title: 'Test migration',
        body: 'Test PR message, part 2',
      });
    });

    it('does not update an existing PR that has been closed', async () => {
      const octokit = mockPrOctokit({
        data: [{
          number: 1234,
          state: 'closed',
        }],
      });
      const adapter = new GithubAdapter(mockMigrationContext() as IMigrationContext, octokit);
      expect(adapter.createPullRequest(REPO, 'Test PR message, part 2')).rejects.toThrow();
      const updateMock: jest.Mock = octokit.pullRequests.update as jest.Mock;
      expect(updateMock).not.toBeCalled();
    });
  });
});
