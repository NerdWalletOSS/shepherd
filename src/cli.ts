#!/usr/bin/env node
import 'babel-polyfill';

import { homedir } from 'os';
import path from 'path';
import fs from 'fs-extra';
import program from 'commander';
import Preferences from 'preferences';

import { MigrationContext, MigrationInfo } from "./migration-context";
import { loadSpec } from './util/migration-spec';
import { adapterForName } from './adapters';
import { loadRepoList } from './util/persisted-data';

// Commands
import checkout from './commands/checkout';
import apply from './commands/apply';

const shepherdDir = path.join(homedir(), '.shepherd');
const prefs = new Preferences('com.nerdwallet.shepherd', {
  workingDirectory: shepherdDir,
}, {
  encrypt: false,
  file: path.join(shepherdDir, 'prefs.yaml'),
  format: 'yaml',
});

type CommandHandler = (context: MigrationContext, options: any) => Promise<void>

interface CLIOptions {
  repos?: Array<string>
}

const handleCommand = (handler: CommandHandler) => async (migration: string, options: CLIOptions) => {
  const spec = loadSpec(migration);
  const migrationWorkingDirectory = path.join(prefs.workingDirectory, spec.name);
  await fs.ensureDir(migrationWorkingDirectory);
  const migrationContext: MigrationContext = {
    shepherd: {
      workingDirectory: prefs.workingDirectory,
    },
    migration: {
      spec,
      migrationDirectory: migration,
      workingDirectory: migrationWorkingDirectory,
    },
  } as MigrationContext;
  const adapter = adapterForName(spec.adapter, migrationContext);
  migrationContext.adapter = adapter;
  const selectedRepos = options.repos && options.repos.map(adapter.parseSelectedRepo);
  migrationContext.migration.selectedRepos = selectedRepos;
  // The list of repos be null if migration hasn't started yet
  migrationContext.migration.repos = loadRepoList(migrationContext);
  try {
    await handler(migrationContext, options);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
};

const addCommand = (name: string, description: string, handler: CommandHandler) => {
  program
    .command(`${name} <migration>`, description)
    .option('--repos <repos>', 'Comma-separated list of repos to operate on', val => val.split(','))
    .action(handleCommand(handler));
};

addCommand('checkout', 'Check out any repositories that are candidates for a given migration', checkout);
addCommand('apply', 'Apply a migration to all checked out repositories', apply);

program.parse(process.argv);
