import { MigrationContext } from '../migration-context';

export interface Repo {
  [key: string]: any,
}

abstract class BaseAdapter {
  protected migrationContext: MigrationContext;

  constructor(migrationContext: MigrationContext) {
    this.migrationContext = migrationContext;
  }

  abstract async getCandidateRepos(): Promise<Array<Repo>>;

  abstract parseSelectedRepo(repo: string): Repo;

  abstract reposEqual(repo1: Repo, repo2: Repo): boolean;

  abstract formatRepo(repo: Repo): string

  abstract async checkoutRepo(repo: Repo): Promise<void>;

  abstract async getRepoDir(repo: Repo): Promise<string>;

  abstract async getDataDir(repo: Repo): Promise<string>
}

export default BaseAdapter;
