import pr from './pr.js';
import { IMigrationContext } from '../migration-context.js';
import mockAdapter from '../adapters/adapter.mock.js';
import mockLogger from '../logger/logger.mock.js';
import executeSteps from '../util/execute-steps.js';
import { generatePrMessageWithFooter } from '../util/generate-pr-message.js';

jest.mock('../util/execute-steps');
jest.mock('../util/generate-pr-message');

describe('pr commmand', () => {
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

  it('should log error if no pr_message hook is specified', async () => {
    await pr(mockContext);

    expect(mockLogger.error).toHaveBeenCalledTimes(1);
    expect(mockLogger.error).toHaveBeenCalledWith(
      'No pr_message hook specified in the migration spec'
    );
  });

  it('should call executeSteps for each repo', async () => {
    mockContext.migration.spec.hooks.pr_message = ['pr_message'];
    mockContext.migration.selectedRepos = [{ name: 'repo1' }, { name: 'repo2' }];
    (executeSteps as jest.Mock).mockResolvedValueOnce({ succeeded: true, results: [] });
    await pr(mockContext);

    expect(executeSteps).toHaveBeenCalledTimes(2);
    expect(executeSteps).toHaveBeenNthCalledWith(
      1,
      mockContext,
      { name: 'repo1' },
      'pr_message',
      false
    );
    expect(executeSteps).toHaveBeenNthCalledWith(
      2,
      mockContext,
      { name: 'repo2' },
      'pr_message',
      false
    );
  });

  it('should create a pull request for each repo', async () => {
    mockContext.migration.spec.hooks.pr_message = ['pr_message'];
    (executeSteps as jest.Mock).mockResolvedValueOnce({ succeeded: true, results: [] });
    (generatePrMessageWithFooter as jest.Mock).mockReturnValueOnce('footer message');
    await pr(mockContext);

    expect(mockAdapter.createPullRequest).toHaveBeenCalledTimes(1);
    expect(mockAdapter.createPullRequest).toHaveBeenCalledWith(
      { name: 'selectedRepos' },
      'footer message',
      'upstreamOwner'
    );
  });

  it('handles create pull request error', async () => {
    mockContext.migration.spec.hooks.pr_message = ['pr_message'];
    (executeSteps as jest.Mock).mockResolvedValueOnce({ succeeded: true, results: [] });
    (generatePrMessageWithFooter as jest.Mock).mockReturnValueOnce('footer message');
    (mockAdapter.createPullRequest as jest.Mock).mockRejectedValueOnce('createPullRequest error');
    await pr(mockContext);

    expect(mockLogger.error).toHaveBeenCalledTimes(1);
    expect(mockLogger.error).toHaveBeenCalledWith('createPullRequest error');
  });

  it('handles failed executeSteps', async () => {
    mockContext.migration.spec.hooks.pr_message = ['pr_message'];
    (executeSteps as jest.Mock).mockResolvedValueOnce({ succeeded: false, results: [] });
    await pr(mockContext);

    expect(generatePrMessageWithFooter).not.toHaveBeenCalled();
  });
});
