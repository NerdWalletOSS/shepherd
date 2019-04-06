#!/usr/bin/env node

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
import list from './commands/list';
import query from './commands/query';
import pr from './commands/pr';
import prPreview from './commands/pr-preview';
import prStatus from './commands/pr-status';
import push from './commands/push';
import reset from './commands/reset';

import ConsoleLogger from './logger';

const shepherdDir = path.join(homedir(), '.shepherd');
const prefs = new Preferences('com.nerdwallet.shepherd', {
  workingDirectory: shepherdDir,
}, {
  encrypt: false,
  file: path.join(shepherdDir, 'prefs.yaml'),
  format: 'yaml',
});
const logger = new ConsoleLogger();

type CommandHandler = (context: IMigrationContext, options: any) => Promise<void>;

interface ICliOptions {
  repos?: string[];
  package?: string;
}

const handleAgnosticCommand = (handler: CommandHandler) => async (migration: string, options: ICliOptions) => {
    // Obviate need to be within in a migration directory if just querying
    // directly. Short circuit code path and directly invoke the command
    try {
      const spec = {
        id: 'query:package-direct',
        title: 'Short circuit query...',
        adapter: {
          type: 'github',
          search_query: '',
        },
        hooks: {
          should_migrate: [''],
          apply: [''],
          pr_message: [''],
        },
      };

      const migrationContext = {
        migration: {
          spec,
        },
        shepherd: {
          // TODO: not sure if needed
          workingDirectory: prefs.workingDirectory,
        },
        logger,
      } as any;

      const adapter = adapterForName('github', migrationContext);
      migrationContext.adapter = adapter;

      await handler(migrationContext, options);
    } catch (e) {
      logger.error(e);
      process.exit(1);
    }
}

const handleCommand = (handler: CommandHandler) => async (migration: string, options: ICliOptions) => {
  try {
      const spec = loadSpec(migration);
      const migrationWorkingDirectory = path.join(prefs.workingDirectory, spec.id);
      await fs.ensureDir(migrationWorkingDirectory);

      // We can't use type-checking on this context just yet since we have to dynamically
      // assign some properties
      const migrationContext = {
        migration: {
          migrationDirectory: path.resolve(migration),
          spec,
          workingDirectory: migrationWorkingDirectory,
        },
        shepherd: {
          workingDirectory: prefs.workingDirectory,
        },
        logger,
      } as any;

      const adapter = adapterForName(spec.adapter.type, migrationContext);
      migrationContext.adapter = adapter;

      const selectedRepos = options.repos && options.repos.map(adapter.parseRepo);
      migrationContext.migration.selectedRepos = selectedRepos;

      // The list of repos will be null if migration hasn't started yet
      migrationContext.migration.repos = await loadRepoList(migrationContext);

      await handler(migrationContext, options);
  } catch (e) {
    logger.error(e);
    process.exit(1);
  }
};

const buildCommand = (name: string, description: string) => {
  return program.command(`${name} <migration>`).description(description);
};

const addReposOption = (command: program.Command) => {
  return command.option('--repos <repos>', 'Comma-separated list of repos to operate on', (val) => val.split(','));
};

const addCommand = (name: string, description: string, repos: boolean, handler: CommandHandler) => {
  const subprogram = buildCommand(name, description);
  if (repos) {
    addReposOption(subprogram);
  }
  subprogram.action(handleCommand(handler));
};

addCommand('checkout', 'Check out any repositories that are candidates for a given migration', true, checkout);

const queryCommand = buildCommand('query', 'Queries GitHub for the search results but does not perform a checkout');
queryCommand.option('--package <string>', 'String to search for in package.json. If not provided, defaults to query in shepherd.yml');
queryCommand.action(handleAgnosticCommand(query));

const applyCommand = buildCommand('apply', 'Apply a migration to all checked out repositories');
addReposOption(applyCommand);
applyCommand.option('--skip-reset-branch', 'Don\'t reset branch before applying', false);
applyCommand.option('--force-reset-branch', 'Force a reset of the branch before applying', true);
applyCommand.option('--skip-reset-on-error', 'Keep changes in the working tree even if the migration fails', false);
applyCommand.action(handleCommand(apply));

addCommand('commit', 'Commit all changes for the specified migration', true, commit);
addCommand('reset', 'Reset all changes for the specified migration', true, reset);

const pushCommand = buildCommand('push', 'Push all changes for the specified migration');
addReposOption(pushCommand);
pushCommand.option('-f, --force', 'Force push, skipping any safety checks');
pushCommand.action(handleCommand(push));

addCommand('pr-preview', 'View a preview of the PR messages for the specified migration', true, prPreview);
addCommand('pr', 'Create PRs for the specified migration', true, pr);
addCommand('pr-status', 'Check the status of all PRs for the specified migration', true, prStatus);

// These commands don't take --repos arguments
addCommand('list', 'List all checked out repositories for the given migration', false, list);

program.on('command:*', () => {
  logger.error(`Error: no such command "${program.args[0]}"`);
  process.exit(1);
});

program.parse(process.argv);
