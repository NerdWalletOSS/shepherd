import push from './push';
import { IMigrationContext } from '../migration-context';
import mockAdapter from '../adapters/adapter.mock';
import mockLogger from '../logger/logger.mock';

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
