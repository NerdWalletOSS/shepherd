#!/usr/bin/env node
require('babel-polyfill');
const { homedir } = require('os');
const path = require('path');
const fs = require('fs-extra');
const program = require('commander');
const Preferences = require('preferences');

const { loadSpec } = require('./util/spec');
const { adapterForName } = require('./adapters');
const { loadRepoList } = require('./util/persisted-data');

// Commands
const checkout = require('./commands/checkout');
const apply = require('./commands/apply');

const shepherdDir = path.join(homedir(), '.shepherd');
const prefs = new Preferences('com.nerdwallet.shepherd', {
  workingDirectory: shepherdDir,
}, {
  encrypt: false,
  file: path.join(shepherdDir, 'prefs.yaml'),
  format: 'yaml',
});

const handleCommand = handler => async (migration, options) => {
  const spec = loadSpec(migration);
  const migrationWorkingDirectory = path.join(prefs.workingDirectory, spec.name);
  await fs.ensureDir(migrationWorkingDirectory);
  const migrationContext = {
    shepherd: {
      workingDirectory: prefs.workingDirectory,
    },
    migration: {
      spec,
      migrationDirectory: null,
      workingDirectory: migrationWorkingDirectory,
    },
  };
  const Adapter = adapterForName(spec.adapter);
  const adapter = new Adapter(migrationContext);
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

const addCommand = (name, description, handler) => {
  program
    .command(`${name} <migration>`)
    .option('--repos <repos>', 'Comma-separated list of repos to operate on', val => val.split(','))
    .action(handleCommand(handler));
};

addCommand('checkout', 'Check out any repositories that are candidates for a given migration', checkout);
addCommand('apply', 'Apply a migration to all checked out repositories', apply);

program.parse(process.argv);
