import apply from './apply';
import { IMigrationContext } from '../migration-context';
import mockAdapter from '../adapters/adapter.mock';
import mockLogger from '../logger/logger.mock';
import executeSteps from '../util/execute-steps';

jest.mock('../util/execute-steps');

describe('apply commmand', () => {
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
        repos: [{ name: 'selectedRepos' }],
        upstreamOwner: 'upstreamOwner',
      },
      adapter: mockAdapter,
      logger: mockLogger,
    };
    options = {};
  });

  it('should reset changes and reset branch before applying migration', async () => {
    (executeSteps as jest.Mock).mockResolvedValueOnce({
      succeeded: true,
      stepResults: [],
    });
    await apply(mockContext, options);

    expect(mockContext.adapter.resetChangedFiles).toHaveBeenCalled();
    expect(mockContext.adapter.resetRepoBeforeApply).toHaveBeenCalled();
  });

  it('should not reset branch if skipResetBranch option is true', async () => {
    (executeSteps as jest.Mock).mockResolvedValueOnce({
      succeeded: true,
      stepResults: [],
    });
    options.skipResetBranch = true;
    await apply(mockContext, options);

    expect(mockContext.adapter.resetChangedFiles).toHaveBeenCalled();
    expect(mockContext.adapter.resetRepoBeforeApply).not.toHaveBeenCalled();
  });

  it('should reset changes if apply steps fail and skipResetOnError option is false', async () => {
    (executeSteps as jest.Mock).mockResolvedValueOnce({
      succeeded: false,
      stepResults: [],
    });
    await apply(mockContext, options);

    expect(mockContext.adapter.resetChangedFiles).toHaveBeenCalled();
  });

  it('should not reset changes if apply steps fail and skipResetOnError option is true', async () => {
    (executeSteps as jest.Mock).mockResolvedValueOnce({
      succeeded: false,
      stepResults: [],
    });
    options.skipResetOnError = true;
    await apply(mockContext, options);

    expect(mockContext.adapter.resetChangedFiles).toHaveBeenCalledTimes(1);
  });

  it('should reset changes if apply steps fail and skipResetOnError option is false', async () => {
    (executeSteps as jest.Mock).mockResolvedValueOnce({
      succeeded: false,
      stepResults: [],
    });
    await apply(mockContext, options);

    expect(mockContext.adapter.resetChangedFiles).toHaveBeenCalledTimes(2);
  });

  it('handles resetChangedFiles error', async () => {
    mockContext.adapter.resetChangedFiles = jest
      .fn()
      .mockRejectedValueOnce(new Error('resetChangedFiles error'));
    await apply(mockContext, options);

    expect(mockContext.logger.error).toHaveBeenCalledWith(new Error('resetChangedFiles error'));
  });

  it('handles resetRepoBeforeApply error', async () => {
    mockContext.adapter.resetRepoBeforeApply = jest
      .fn()
      .mockRejectedValueOnce(new Error('resetRepoBeforeApply error'));
    await apply(mockContext, options);

    expect(mockContext.logger.error).toHaveBeenCalledWith(new Error('resetRepoBeforeApply error'));
  });

  it('should catch error when resetChangedFiles fails and apply steps fail when skipResetOnError option is false', async () => {
    (executeSteps as jest.Mock).mockResolvedValueOnce({
      succeeded: false,
      stepResults: [],
    });
    mockContext.adapter.resetChangedFiles = jest
      .fn()
      .mockResolvedValueOnce('success')
      .mockRejectedValueOnce(new Error('Apply steps error'));
    await apply(mockContext, options);

    expect(mockContext.adapter.resetChangedFiles).toHaveBeenCalledTimes(2);
    expect(mockContext.logger.error).toHaveBeenCalledWith(new Error('Apply steps error'));
  });
});
