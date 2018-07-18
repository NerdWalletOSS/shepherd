#!/usr/bin/env node
import 'babel-polyfill';

import program from 'commander';
import fs from 'fs-extra';
import { homedir } from 'os';
import path from 'path';
import Preferences from 'preferences';

import { adapterForName } from './adapters';
import { IMigrationContext } from './migration-context';
import { loadSpec } from './util/migration-spec';
import { loadRepoList } from './util/persisted-data';

// Commands
import apply from './commands/apply';
import checkout from './commands/checkout';
import commit from './commands/commit';
import push from './commands/push';
import reset from './commands/reset';

import Logger from './logger';

const shepherdDir = path.join(homedir(), '.shepherd');
const prefs = new Preferences('com.nerdwallet.shepherd', {
  workingDirectory: shepherdDir,
}, {
  encrypt: false,
  file: path.join(shepherdDir, 'prefs.yaml'),
  format: 'yaml',
});
const logger = new Logger();

type CommandHandler = (context: IMigrationContext, options: any) => Promise<void>;

interface ICliOptions {
  repos?: string[];
}

const handleCommand = (handler: CommandHandler) => async (migration: string, options: ICliOptions) => {
  const spec = loadSpec(migration);
  const migrationWorkingDirectory = path.join(prefs.workingDirectory, spec.name);
  await fs.ensureDir(migrationWorkingDirectory);

  // We can't use type-checking on this context just yet since we have to dynamically
  // assign some properties
  const migrationContext = {
    migration: {
      migrationDirectory: migration,
      spec,
      workingDirectory: migrationWorkingDirectory,
    },
    shepherd: {
      workingDirectory: prefs.workingDirectory,
    },
    logger,
  } as any;

  const adapter = adapterForName(spec.adapter, migrationContext);
  migrationContext.adapter = adapter;

  const selectedRepos = options.repos && options.repos.map(adapter.parseSelectedRepo);
  migrationContext.migration.selectedRepos = selectedRepos;

  // The list of repos be null if migration hasn't started yet
  migrationContext.migration.repos = loadRepoList(migrationContext);

  try {
    await handler(migrationContext, options);
  } catch (e) {
    logger.error(e);
    process.exit(1);
  }
};

const addCommand = (name: string, description: string, handler: CommandHandler) => {
  program
    .command(`${name} <migration>`)
    .description(description)
    .option('--repos <repos>', 'Comma-separated list of repos to operate on', (val) => val.split(','))
    .action(handleCommand(handler));
};

addCommand('checkout', 'Check out any repositories that are candidates for a given migration', checkout);
addCommand('apply', 'Apply a migration to all checked out repositories', apply);
addCommand('commit', 'Commit all changes for the specified migration', commit);
addCommand('reset', 'Reset all changes for the specified migration', reset);
addCommand('push', 'Push all changes for the specified migration', push);

program.on('command:*', () => {
  logger.error(`Error: no such command "${program.args[0]}"`);
  process.exit(1);
});

program.parse(process.argv);
