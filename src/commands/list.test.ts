import list from './list.js';
import { IMigrationContext } from '../migration-context.js';
import mockAdapter from '../adapters/adapter.mock.js';
import mockLogger from '../logger/logger.mock.js';

describe('list commmand', () => {
  let mockContext: IMigrationContext;

  beforeEach(() => {
    jest.clearAllMocks();
    mockContext = {
      shepherd: {
        workingDirectory: 'workingDirectory',
      },
      migration: {
        migrationDirectory: 'migrationDirectory',
        spec: {
          id: 'id',
          title: 'title',
          adapter: {
            type: 'adapter',
          },
          hooks: {},
        },
        workingDirectory: 'workingDirectory',
        selectedRepos: [{ name: 'selectedRepos' }],
        repos: [{ name: 'selectedRepos' }],
        upstreamOwner: 'upstreamOwner',
      },
      adapter: mockAdapter,
      logger: mockLogger,
    };
  });

  it('should call stringifyRepo for each repo', async () => {
    await list(mockContext);

    expect(mockAdapter.stringifyRepo).toHaveBeenCalledTimes(1);
    expect(mockAdapter.stringifyRepo).toHaveBeenCalledWith({ name: 'selectedRepos' });
  });

  it('should not call stringifyRepo if no repos', async () => {
    mockContext.migration.repos = null;
    await list(mockContext);

    expect(mockAdapter.stringifyRepo).not.toHaveBeenCalled();
  });
});
