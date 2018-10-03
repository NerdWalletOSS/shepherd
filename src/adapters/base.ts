export interface IRepo {
  [key: string]: any;
}

export type RetryMethod = (opts: number) => any;

interface IRepoAdapter {
  getCandidateRepos(onRetry: RetryMethod): Promise<IRepo[]>;

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
}

export default IRepoAdapter;
