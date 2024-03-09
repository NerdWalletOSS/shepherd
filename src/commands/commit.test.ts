import { IMigrationContext } from '../migration-context';
import commit from './commit';
import mockAdapter from '../adapters/adapter.mock';
import mockLogger from '../logger/logger.mock';
import mockSpinner from '../logger/spinner.mock';

describe('commit command', () => {
  const mockContext: IMigrationContext = {
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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('handles successful commit', async () => {
    await commit(mockContext);
    expect(mockAdapter.commitRepo).toHaveBeenCalledWith({ name: 'selectedRepos' });
    expect(mockSpinner.succeed).toHaveBeenCalledWith('Changes committed');
  });

  it('handles failed commit', async () => {
    mockAdapter.commitRepo = jest.fn().mockImplementationOnce(() => {
      throw new Error('Mocked error');
    });
    await commit(mockContext);
    expect(mockLogger.error).toHaveBeenCalledWith(new Error('Mocked error'));
    expect(mockSpinner.fail).toHaveBeenCalledWith('Failed to commit changes');
  });
});
