import IRepoAdapter, { IEnvironmentVariables, IRepo } from './base';

const mockAdapter: IRepoAdapter = {
  getCandidateRepos: jest.fn() as unknown as (onRetry: jest.Mock) => Promise<IRepo[]>,
  parseRepo: jest.fn() as unknown as (repo: string) => IRepo,
  reposEqual: jest.fn() as unknown as (repo1: IRepo, repo2: IRepo) => boolean,
  stringifyRepo: jest.fn() as unknown as (repo: IRepo) => string,
  mapRepoAfterCheckout: jest.fn() as unknown as (repo: Readonly<IRepo>) => Promise<IRepo>,
  checkoutRepo: jest.fn() as unknown as (repo: IRepo) => Promise<void>,
  resetChangedFiles: jest.fn() as unknown as (repo: IRepo) => Promise<void>,
  resetRepoBeforeApply: jest.fn() as unknown as (repo: IRepo, force: boolean) => Promise<void>,
  commitRepo: jest.fn() as unknown as (repo: IRepo) => Promise<void>,
  pushRepo: jest.fn() as unknown as (repo: IRepo, force: boolean) => Promise<void>,
  createPullRequest: jest.fn() as unknown as (
    repo: IRepo,
    message: string,
    upstreamOwner: string
  ) => Promise<void>,
  getPullRequestStatus: jest.fn() as unknown as (repo: IRepo) => Promise<string[]>,
  getRepoDir: jest.fn() as unknown as (repo: IRepo) => string,
  getDataDir: jest.fn() as unknown as (repo: IRepo) => string,
  getBaseBranch: jest.fn() as unknown as (repo: IRepo) => string,
  getEnvironmentVariables: jest.fn() as unknown as (repo: IRepo) => Promise<IEnvironmentVariables>,
  createIssue: jest.fn() as unknown as (repo: IRepo) => Promise<string>,
  updateIssue: jest.fn() as unknown as (repo: IRepo) => Promise<void>,
};

export default mockAdapter;
