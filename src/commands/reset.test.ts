import reset from './reset';
import { IMigrationContext } from '../migration-context';
import mockAdapter from '../adapters/adapter.mock';
import mockLogger from '../logger/logger.mock';

describe('reset commmand', () => {
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

  it('should reset changes', async () => {
    await reset(mockContext);

    expect(mockContext.adapter.resetChangedFiles).toHaveBeenCalled();
  });

  it('should log error if reset fails', async () => {
    mockContext.adapter.resetChangedFiles = jest.fn().mockRejectedValue('resetChangedFiles error');
    await reset(mockContext);

    expect(mockContext.logger.error).toHaveBeenCalledWith('resetChangedFiles error');
  });
});
