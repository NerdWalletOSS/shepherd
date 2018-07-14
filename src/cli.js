#!/usr/bin/env node
require("babel-polyfill");
const { homedir } = require('os');
const path = require('path');
const fs = require('fs-extra')
const program = require('commander');
const Preferences = require('preferences');
const async = require('async');

const GithubAdapter = require('./adapters/github');
const checkout = require('./commands/checkout');

const list = (val) => val.split(',');

const shepherdDir = path.join(homedir(), '.shepherd');

const prefs = new Preferences('com.nerdwallet.shepherd', {
  workingDirectory: shepherdDir,
}, {
  encrypt: false,
  file: path.join(shepherdDir, 'prefs.yaml'),
  format: 'yaml',
});

const handleCommand = (handler) => async (migration, options) => {
  const migrationWorkingDirectory = path.join(prefs.workingDirectory, migration);
  await fs.ensureDir(migrationWorkingDirectory);
  const migrationContext = {
    shepherd: {
      workingDirectory: prefs.workingDirectory,
    },
    migration: {
      name: migration,
      migrationDirectory: null,
      workingDirectory: migrationWorkingDirectory,
    },
  };
  const adapter = new GithubAdapter(migrationContext);
  migrationContext.adapter = adapter;
  const selectedRepos = options.repos && options.repos.map(adapter.parseSelectedRepo);
  migrationContext.migration.selectedRepos = selectedRepos;
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
    .option('--repos <repos>', 'Comma-separated list of repos to operate on', list)
    .action(handleCommand(handler));
}

addCommand('checkout', 'Check out any repositories that are candidates for a given migration', checkout);

program.parse(process.argv);
