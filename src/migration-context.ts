import IRepoAdapter, { IRepo } from './adapters/base.js';
import { ILogger } from './logger/index.js';
import { IMigrationSpec } from './util/migration-spec.js';

export interface IShepherdInfo {
  workingDirectory: string;
}

export interface IMigrationInfo {
  spec: IMigrationSpec;
  migrationDirectory: string;
  workingDirectory: string;
  repos: IRepo[] | null;
  upstreamOwner: string;
  selectedRepos?: IRepo[];
}

export interface IMigrationContext {
  shepherd: IShepherdInfo;
  migration: IMigrationInfo;
  adapter: IRepoAdapter;
  logger: ILogger;
}
