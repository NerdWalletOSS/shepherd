import { MigrationSpec } from './util/migration-spec';
import BaseAdapter, { Repo } from './adapters/base';

export interface ShepherdInfo {
    workingDirectory: string
}

export interface MigrationInfo {
    spec: MigrationSpec,
    migrationDirectory: string,
    workingDirectory: string,
    repos?: Array<Repo>,
    selectedRepos?: Array<Repo>
}

export interface MigrationContext {
  shepherd: ShepherdInfo,
  migration: MigrationInfo,
  adapter: BaseAdapter,
}