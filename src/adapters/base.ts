import { IMigrationContext } from '../migration-context';

export interface IRepo {
  [key: string]: any;
}

abstract class BaseAdapter {
  protected migrationContext: IMigrationContext;

  constructor(migrationContext: IMigrationContext) {
    this.migrationContext = migrationContext;
  }

  public abstract async getCandidateRepos(): Promise<IRepo[]>;

  public abstract parseSelectedRepo(repo: string): IRepo;

  public abstract reposEqual(repo1: IRepo, repo2: IRepo): boolean;

  public abstract formatRepo(repo: IRepo): string;

  public abstract async checkoutRepo(repo: IRepo): Promise<void>;

  public abstract async commitRepo(repo: IRepo): Promise<void>;

  public abstract async resetRepo(repo: IRepo): Promise<void>;

  public abstract async pushRepo(repo: IRepo): Promise<void>;

  public abstract async prRepo(repo: IRepo, message: string): Promise<void>;

  public abstract getRepoDir(repo: IRepo): string;

  public abstract getDataDir(repo: IRepo): string;
}

export default BaseAdapter;
