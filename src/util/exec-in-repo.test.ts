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

  it('should execute a command in a repo', async () => {
    const repo = { name: 'repo' };
    const command = 'command';
    const { stdout, stderr } = await execInRepo(mockContext, repo, command);
    expect(stdout).toBe('');
    expect(stderr).toBe('');
  });
});
