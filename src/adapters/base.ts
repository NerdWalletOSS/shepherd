export interface IRepo {
  [key: string]: any;
}

export interface IEnvironmentVariables {
  [key: string]: string;
}

export interface ISearchCandidate {
  [key: string]: any;
}

export type RetryMethod = (opts: number) => any;

export type FilterCandidateMethod = (candidate: ISearchCandidate) => Promise<boolean>;

interface IRepoAdapter {
  getCandidateRepos(onRetry: RetryMethod, filterCandidate: FilterCandidateMethod): Promise<IRepo[]>;

  parseRepo(repo: string): IRepo;

  reposEqual(repo1: IRepo, repo2: IRepo): boolean;

  stringifyRepo(repo: IRepo): string;

  mapRepoAfterCheckout(repo: Readonly<IRepo>): Promise<IRepo>;

  checkoutRepo(repo: IRepo): Promise<void>;

  resetChangedFiles(repo: IRepo): Promise<void>;

  resetRepoBeforeApply(repo: IRepo, force: boolean): Promise<void>;

  commitRepo(repo: IRepo): Promise<void>;

  pushRepo(repo: IRepo, force: boolean): Promise<void>;

  createPullRequest(repo: IRepo, message: string): Promise<void>;

  getPullRequestStatus(repo: IRepo): Promise<string[]>;

  getRepoDir(repo: IRepo): string;

  getDataDir(repo: IRepo): string;

  getBaseBranch(repo: IRepo): string;

  getFilterCandidateEnvironmentVariable(candidate: ISearchCandidate): Promise<IEnvironmentVariables>;

  getEnvironmentVariables(repo: IRepo): Promise<IEnvironmentVariables>;
}

export default IRepoAdapter;
