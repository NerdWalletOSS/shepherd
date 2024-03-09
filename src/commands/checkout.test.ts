import { IMigrationContext } from '../migration-context';
import checkout from './checkout';
import mockAdapter from '../adapters/adapter.mock';
import mockLogger from '../logger/logger.mock';
import mockSpinner from '../logger/spinner.mock';
import executeSteps from '../util/execute-steps';

jest.mock('fs-extra', () => {
  return {
    // Mock other methods as needed
    mkdirs: jest.fn().mockResolvedValue(undefined),
    pathExists: jest.fn().mockResolvedValue(true),
    readFile: jest.fn().mockResolvedValue('{"name": "test"}'),
    outputFile: jest.fn().mockResolvedValue(undefined),
    remove: jest.fn().mockResolvedValue(undefined),
  };
});

jest.mock('../util/execute-steps');

describe('checkout command', () => {
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

  it('clones repos given a specific list of repos', async () => {
    (executeSteps as jest.Mock)
      .mockResolvedValueOnce({
        succeeded: true,
        stepResults: [],
      })
      .mockResolvedValueOnce({
        succeeded: true,
        stepResults: [],
      });
    await checkout(mockContext);
    expect(mockLogger.info).toHaveBeenCalledWith('Using 1 selected repos');
    expect(mockAdapter.checkoutRepo).toHaveBeenCalledWith({ name: 'selectedRepos' });
    expect(mockSpinner.succeed).toHaveBeenCalledWith('Checked out repo');
  });

  it('gets candidate repos when list of repos is not provided', async () => {
    mockContext.migration.selectedRepos = undefined;
    await checkout(mockContext);
    expect(mockAdapter.getCandidateRepos).toHaveBeenCalled();
    expect(mockSpinner.succeed).toHaveBeenCalledWith('Loaded 0 repos');
  });

  it('handles errors when checking out repos', async () => {
    mockContext.migration.selectedRepos = [{ name: 'selectedRepos' }];
    mockContext.migration.repos = null;
    mockAdapter.checkoutRepo = jest.fn().mockImplementationOnce(() => {
      throw new Error('Mocked error');
    });
    await checkout(mockContext);
    expect(mockLogger.error).toHaveBeenCalledWith(new Error('Mocked error'));
    expect(mockSpinner.fail).toHaveBeenCalledWith('Failed to check out repo; skipping');
  });

  it('handles errors when running should_migrate steps', async () => {
    mockContext.migration.selectedRepos = [{ name: 'selectedRepos' }];
    mockContext.migration.repos = null;
    (executeSteps as jest.Mock).mockResolvedValueOnce({
      succeeded: false,
      stepResults: [],
    });
    await checkout(mockContext);
    expect(mockLogger.failIcon).toHaveBeenCalledWith(
      'Error running should_migrate steps; skipping'
    );
  });

  it('handles errors when running post_checkout steps', async () => {
    mockContext.migration.selectedRepos = [{ name: 'selectedRepos' }];
    (executeSteps as jest.Mock)
      .mockResolvedValueOnce({
        succeeded: true,
        stepResults: [],
      })
      .mockResolvedValueOnce({
        succeeded: false,
        stepResults: [],
      });

    await checkout(mockContext);
    expect(mockLogger.failIcon).toHaveBeenCalledWith('Error running post_checkout steps; skipping');
  });
});
