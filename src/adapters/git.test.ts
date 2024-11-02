import { simpleGit } from 'simple-git';
import GitAdapter from '../../src/adapters/git.js';
import { IRepo, RetryMethod } from '../../src/adapters/base.js';
import { IMigrationContext } from '../migration-context.js';

jest.mock('simple-git');
jest.mock('fs-extra');

class TestGitAdapter extends GitAdapter {
  // @ts-ignore
  createIssue(repo: IRepo): Promise<string> {
    return Promise.resolve('');
  }
  // @ts-ignore
  updateIssue(repo: IRepo, issueNumber: number): Promise<void> {
    return Promise.resolve();
  }
  // @ts-ignore
  getCandidateRepos(onRetry: RetryMethod): Promise<IRepo[]> {
    return Promise.resolve([]);
  }
  // @ts-ignore
  parseRepo(repo: string): IRepo {
    return { owner: '', repo: '' };
  }
  // @ts-ignore
  reposEqual(repo1: IRepo, repo2: IRepo): boolean {
    return true;
  }
  // @ts-ignore
  stringifyRepo(repo: IRepo): string {
    return '';
  }
  // @ts-ignore
  getRepoDir(repo: IRepo): string {
    return '/mock/repo/dir';
  }
  // @ts-ignore
  getDataDir(repo: IRepo): string {
    return '';
  }
  // @ts-ignore
  mapRepoAfterCheckout(repo: Readonly<IRepo>): Promise<IRepo> {
    return Promise.resolve(repo);
  }
  // @ts-ignore
  resetRepoBeforeApply(repo: IRepo, force: boolean): Promise<void> {
    return Promise.resolve();
  }
  // @ts-ignore
  createPullRequest(repo: IRepo, message: string, upstreamOwner: string): Promise<void> {
    return Promise.resolve();
  }
  // @ts-ignore
  getPullRequestStatus(repo: IRepo): Promise<string[]> {
    return Promise.resolve([]);
  }
  // @ts-ignore
  getBaseBranch(repo: IRepo): string {
    return 'main';
  }
  // @ts-ignore
  getRepositoryUrl(repo: IRepo): string {
    return 'https://mock/repository/url';
  }
}

describe('GitAdapter', () => {
  let gitAdapter: TestGitAdapter;
  let mockContext: IMigrationContext;

  beforeEach(() => {
    mockContext = {
      migration: { spec: { id: 'test-branch', title: 'test-migration' } },
    } as IMigrationContext;
    gitAdapter = new TestGitAdapter(mockContext);
  });

  it('should checkout repository', async () => {
    const repo = { owner: 'owner', repo: 'repo' };
    const git = {
      checkIsRepo: jest.fn().mockResolvedValue(true),
      fetch: jest.fn(),
      clone: jest.fn(),
      checkout: jest.fn(),
      checkoutLocalBranch: jest.fn(),
    };
    (simpleGit as any).mockReturnValue(git);

    await gitAdapter.checkoutRepo(repo);

    expect(git.clone).toHaveBeenCalledWith('https://mock/repository/url', '/mock/repo/dir', [
      '--depth',
      '1',
    ]);
    expect(git.checkout).toHaveBeenCalledWith(['-b', 'test-branch', 'origin/test-branch']);
  });

  it('should commit repository', async () => {
    const repo = { owner: 'owner', repo: 'repo' };
    const git = { add: jest.fn(), commit: jest.fn() };
    (simpleGit as any).mockReturnValue(git);

    await gitAdapter.commitRepo(repo);

    expect(git.add).toHaveBeenCalledWith('.');
    expect(git.commit).toHaveBeenCalledWith('test-migration [shepherd]');
  });

  it('should reset changed files', async () => {
    const repo = { owner: 'owner', repo: 'repo' };
    const git = { reset: jest.fn(), clean: jest.fn() };
    (simpleGit as any).mockReturnValue(git);

    await gitAdapter.resetChangedFiles(repo);

    expect(git.reset).toHaveBeenCalledWith(['--hard']);
    expect(git.clean).toHaveBeenCalledWith('f', ['-d']);
  });

  it('should push repository', async () => {
    const repo = { owner: 'owner', repo: 'repo' };
    const git = { push: jest.fn() };
    (simpleGit as any).mockReturnValue(git);

    await gitAdapter.pushRepo(repo, false);

    expect(git.push).toHaveBeenCalledWith('origin', 'HEAD', undefined);
  });

  it('should push repository with force', async () => {
    const repo = { owner: 'owner', repo: 'repo' };
    const git = { push: jest.fn() };
    (simpleGit as any).mockReturnValue(git);

    await gitAdapter.pushRepo(repo, true);

    expect(git.push).toHaveBeenCalledWith('origin', 'HEAD', ['--force']);
  });

  it('should get repository url', () => {
    const repo = { owner: 'owner', repo: 'repo' };

    const result = gitAdapter.getRepositoryUrl(repo);

    expect(result).toBe('https://mock/repository/url');
  });

  it('should get base branch', () => {
    const repo = { owner: 'owner', repo: 'repo' };

    const result = gitAdapter.getBaseBranch(repo);

    expect(result).toBe('main');
  });

  it('should get environment variables', async () => {
    const repo = { owner: 'owner', repo: 'repo' };
    const git = { revparse: jest.fn().mockResolvedValue('mock-revision') };
    (simpleGit as any).mockReturnValue(git);

    const result = await gitAdapter.getEnvironmentVariables(repo);

    expect(result).toEqual({ SHEPHERD_GIT_REVISION: 'mock-revision' });
  });

  it('should map repo after checkout', async () => {
    const repo = { owner: 'owner', repo: 'repo' };

    const result = await gitAdapter.mapRepoAfterCheckout(repo);

    expect(result).toEqual(repo);
  });
});
