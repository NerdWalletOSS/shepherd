import push from './push.js';
import { IMigrationContext } from '../migration-context.js';
import mockAdapter from '../adapters/adapter.mock.js';
import mockLogger from '../logger/logger.mock.js';

describe('push commmand', () => {
  let mockContext: IMigrationContext;
  let options: any;

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
        repos: [],
        upstreamOwner: 'upstreamOwner',
      },
      adapter: mockAdapter,
      logger: mockLogger,
    };
    options = {};
  });

  it('should push changes', async () => {
    mockContext.migration.repos = [{ name: 'selectedRepos' }];
    await push(mockContext, options);
    expect(mockContext.adapter.pushRepo).toHaveBeenCalledWith(
      mockContext.migration.repos[0],
      undefined
    );
  });

  it('should log error if push fails', async () => {
    mockContext.migration.repos = [{ name: 'selectedRepos' }];
    mockContext.adapter.pushRepo = jest.fn().mockRejectedValueOnce('pushRepo error');
    await push(mockContext, options);
    expect(mockContext.logger.error).toHaveBeenCalledWith('pushRepo error');
  });
});
