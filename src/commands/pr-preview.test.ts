import prPreview from './pr-preview';
import { IMigrationContext } from '../migration-context';
import mockAdapter from '../adapters/adapter.mock';
import mockLogger from '../logger/logger.mock';
import executeSteps from '../util/execute-steps';
import { generatePrMessageWithFooter } from '../util/generate-pr-message';

jest.mock('../util/execute-steps');
jest.mock('../util/generate-pr-message');

describe('pr-preview command', () => {
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

  it('handles case when no pr_message hook is not specified', async () => {
    mockContext.migration.spec.hooks.pr_message = [];
    await prPreview(mockContext);
    expect(mockLogger.error).toHaveBeenCalledWith(
      'No pr_message hook specified in the migration spec'
    );
  });

  it('handles successful pr message generation', async () => {
    mockContext.migration.spec.hooks.pr_message = ['test pr message'];
    (executeSteps as jest.Mock).mockResolvedValueOnce({
      succeeded: true,
      stepResults: [],
    });
    await prPreview(mockContext);
    expect(generatePrMessageWithFooter).toHaveBeenCalled();
  });

  it('handles failed pr message generation', async () => {
    mockContext.migration.spec.hooks.pr_message = ['test pr message'];
    (executeSteps as jest.Mock).mockResolvedValueOnce({
      succeeded: false,
      stepResults: [],
    });
    await prPreview(mockContext);
    expect(generatePrMessageWithFooter).not.toHaveBeenCalled();
  });

  it('handles pr message generation when no footer message is generated', async () => {
    mockContext.migration.spec.hooks.pr_message = ['test pr message'];
    (executeSteps as jest.Mock).mockResolvedValueOnce({
      succeeded: true,
      stepResults: [],
    });
    (generatePrMessageWithFooter as jest.Mock).mockReturnValue(null);
    await prPreview(mockContext);
    expect(mockLogger.warn).toHaveBeenCalledWith('[No message contents]');
  });

  it('handles pr message generation when footer message is generated', async () => {
    mockContext.migration.spec.hooks.pr_message = ['test pr message'];
    (executeSteps as jest.Mock).mockResolvedValueOnce({
      succeeded: true,
      stepResults: [],
    });
    (generatePrMessageWithFooter as jest.Mock).mockReturnValue('test pr message');
    await prPreview(mockContext);
    expect(mockLogger.info).toHaveBeenCalledWith('test pr message');
  });
});
