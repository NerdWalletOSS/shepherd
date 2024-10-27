import { IMigrationContext } from '../migration-context';
import { IRepo } from '../adapters/base';
import checkout, { handleRepoCheckout } from './checkout';
import mockAdapter from '../adapters/adapter.mock';
import mockLogger from '../logger/logger.mock';
import executeSteps from '../util/execute-steps';

jest.mock('fs-extra', () => {
  return {
    mkdirs: jest.fn().mockResolvedValue(undefined),
    pathExists: jest.fn().mockResolvedValue(true),
    readFile: jest.fn().mockResolvedValue('{"name": "test"}'),
    outputFile: jest.fn().mockResolvedValue(undefined),
    remove: jest.fn().mockResolvedValue(undefined),
  };
});

jest.mock('../util/execute-steps');
jest.mock('../util/persisted-data');

describe('checkout command', () => {
  let mockContext: IMigrationContext;

  beforeEach(() => {
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
    jest.clearAllMocks();
  });

  it('should load selected repos', async () => {
    await checkout(mockContext);
    expect(mockContext.logger.info).toHaveBeenCalledWith('Using 1 selected repos');
  });
  it('should load candidate repos', async () => {
    mockContext.migration.selectedRepos = undefined;
    mockContext.adapter.getCandidateRepos = jest
      .fn()
      .mockResolvedValue([{ name: 'candidateRepos' }]);

    await checkout(mockContext);

    expect(mockContext.logger.info).toHaveBeenCalledWith('Loading candidate repos');
    expect(mockContext.logger.info).toHaveBeenCalledWith('Loaded 1 repos');
  });

  it('should handle repo checkout', async () => {
    const checkedOutRepos: IRepo[] = [];

    const spinner = {
      start: jest.fn(),
      succeed: jest.fn(),
    };
    mockContext.logger.spinner = jest.fn().mockReturnValue(spinner);

    mockContext.adapter.checkoutRepo = jest.fn().mockImplementation(async (repo) => {
      checkedOutRepos.push(repo);
    });

    await checkout(mockContext);
    expect(checkedOutRepos).toEqual([{ name: 'selectedRepos' }]);
  });
  it('should handle repo checkout failure', async () => {
    const checkedOutRepos: IRepo[] = [];
    const discardedRepos: IRepo[] = [];

    const spinner = {
      start: jest.fn(),
      fail: jest.fn(),
    };
    mockContext.logger.spinner = jest.fn().mockReturnValue(spinner);

    mockContext.adapter.checkoutRepo = jest.fn().mockRejectedValue(new Error('checkout error'));

    await checkout(mockContext);

    expect(checkedOutRepos).toEqual([]);
    expect(discardedRepos).toEqual([]);
    expect(mockContext.logger.info).toHaveBeenCalledWith('Failed to check out repo; skipping');
  });

  it('should handle successful repo checkout', async () => {
    const checkedOutRepos: IRepo[] = [];
    const discardedRepos: IRepo[] = [];
    const repoLogs: string[] = [];
    const repo: IRepo = { name: 'repo1' };

    mockContext.adapter.checkoutRepo = jest.fn().mockResolvedValue(undefined);
    (executeSteps as jest.Mock).mockResolvedValue({ succeeded: true });

    await handleRepoCheckout(mockContext, repo, checkedOutRepos, discardedRepos, repoLogs);

    expect(checkedOutRepos).toEqual([repo]);
    expect(discardedRepos).toEqual([]);
    expect(repoLogs).toContain('Checked out repo');
    expect(repoLogs).toContain('Completed all should_migrate steps successfully');
    expect(repoLogs).toContain('Completed all post_checkout steps successfully');
  });

  it('should handle repo checkout failure', async () => {
    const checkedOutRepos: IRepo[] = [];
    const discardedRepos: IRepo[] = [];
    const repoLogs: string[] = [];
    const repo: IRepo = { name: 'repo1' };

    mockContext.adapter.checkoutRepo = jest.fn().mockRejectedValue(new Error('checkout error'));

    await handleRepoCheckout(mockContext, repo, checkedOutRepos, discardedRepos, repoLogs);

    expect(checkedOutRepos).toEqual([]);
    expect(discardedRepos).toEqual([]);
    expect(repoLogs).toContain('Failed to check out repo; skipping');
  });

  it('should handle should_migrate step failure', async () => {
    const checkedOutRepos: IRepo[] = [];
    const discardedRepos: IRepo[] = [];
    const repoLogs: string[] = [];
    const repo: IRepo = { name: 'repo1' };

    mockContext.adapter.checkoutRepo = jest.fn().mockResolvedValue(undefined);
    //@ts-ignore
    (executeSteps as jest.Mock).mockImplementation((context, repo, step) => {
      if (step === 'post_checkout') {
        return { succeeded: false };
      }
      return { succeeded: false };
    });

    await handleRepoCheckout(mockContext, repo, checkedOutRepos, discardedRepos, repoLogs);

    expect(checkedOutRepos).toEqual([]);
    expect(discardedRepos).toEqual([repo]);
    expect(repoLogs).toContain('Error running should_migrate steps; skipping');
  });

  it('should handle post_checkout step failure', async () => {
    const checkedOutRepos: IRepo[] = [];
    const discardedRepos: IRepo[] = [];
    const repoLogs: string[] = [];
    const repo: IRepo = { name: 'repo1' };

    mockContext.adapter.checkoutRepo = jest.fn().mockResolvedValue(undefined);
    //@ts-ignore
    (executeSteps as jest.Mock).mockImplementation((context, repo, step) => {
      if (step === 'post_checkout') {
        return { succeeded: false };
      }
      return { succeeded: true };
    });

    await handleRepoCheckout(mockContext, repo, checkedOutRepos, discardedRepos, repoLogs);

    expect(checkedOutRepos).toEqual([]);
    expect(discardedRepos).toEqual([repo]);
    expect(repoLogs).toContain('Error running post_checkout steps; skipping');
  });
});
