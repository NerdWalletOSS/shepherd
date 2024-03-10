import mockAdapter from '../adapters/adapter.mock';
import mockLogger from '../logger/logger.mock';
import { IMigrationContext } from '../migration-context';
import execInRepo from './exec-in-repo';

describe('execInRepo utility', () => {
  let mockContext: IMigrationContext;
  beforeEach(() => {
    jest.resetAllMocks();
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

  it('should call spawn with the correct arguments', async () => {
    const result = await execInRepo(mockContext, { name: 'selectedRepos' }, 'command');
    expect(result.promise).toBeDefined();
    expect(result.childProcess).toBeDefined();
    expect(result.promise.childProcess).toBe(result.childProcess);
  });
});
