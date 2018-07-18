import BaseAdapter, { IRepo } from './adapters/base';
import { ILoggerApi } from './logger';
import { IMigrationSpec } from './util/migration-spec';

export interface IShepherdInfo {
  workingDirectory: string;
}

export interface IMigrationInfo {
  spec: IMigrationSpec;
  migrationDirectory: string;
  workingDirectory: string;
  repos: IRepo[] | null;
  selectedRepos?: IRepo[];
}

export interface IMigrationContext {
  shepherd: IShepherdInfo;
  migration: IMigrationInfo;
  adapter: BaseAdapter;
  logger: ILoggerApi;
}
