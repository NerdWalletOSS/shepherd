import prStatus from './pr-status';
import { IMigrationContext } from '../migration-context';
import mockAdapter from '../adapters/adapter.mock';
import mockLogger from '../logger/logger.mock';

describe('pr-status commmand', () => {
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

  it('should call getPullRequestStatus for each repo', async () => {
    await prStatus(mockContext);

    expect(mockAdapter.getPullRequestStatus).toHaveBeenCalledTimes(1);
    expect(mockAdapter.getPullRequestStatus).toHaveBeenCalledWith({ name: 'selectedRepos' });
  });

  it('should log the status for each repo', async () => {
    (mockAdapter.getPullRequestStatus as jest.Mock).mockResolvedValue(['status1', 'status2']);
    mockContext.migration.selectedRepos = [{ name: 'repo1' }, { name: 'repo2' }];
    mockContext.migration.repos = [{ name: 'repo1' }, { name: 'repo2' }];
    await prStatus(mockContext);

    expect(mockLogger.info).toHaveBeenCalledTimes(4);
    expect(mockLogger.info).toHaveBeenCalledWith('status1');
    expect(mockLogger.info).toHaveBeenCalledWith('status2');
  });

  it('should log error if getPullRequestStatus fails', async () => {
    (mockAdapter.getPullRequestStatus as jest.Mock).mockRejectedValue('getPullRequestStatus error');

    await prStatus(mockContext);

    expect(mockLogger.error).toHaveBeenCalledTimes(1);
    expect(mockLogger.error).toHaveBeenCalledWith('getPullRequestStatus error');
  });
});
