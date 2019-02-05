import IRepoAdapter, { IRepo } from './adapters/base';
import { ILogger } from './logger';
import { IMigrationSpec } from './util/migration-spec';

export interface IShepherdInfo {
  workingDirectory: string;
}

export interface IMigrationInfo {
  spec: IMigrationSpec;
  migrationDirectory: string;
  workingDirectory: string;
  repos: IRepo[] | null;
  branch: string;
  selectedRepos?: IRepo[];
}

export interface IMigrationContext {
  shepherd: IShepherdInfo;
  migration: IMigrationInfo;
  adapter: IRepoAdapter;
  logger: ILogger;
}
