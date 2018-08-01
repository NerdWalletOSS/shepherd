/* eslint-env jest */
import fs from 'fs-extra-promise';
import jestFs from 'jest-plugin-fs';
import yaml from 'js-yaml';
import { isEqual } from 'lodash';

import { IRepo } from '../../adapters/base';
import { IMigrationContext } from '../../migration-context';
import { loadRepoList, updateRepoList } from '../persisted-data';

jest.mock('fs', () => require('jest-plugin-fs/mock')); // eslint-disable-line global-require

const reposFixture = [{
  owner: 'NerdWallet',
  name: 'test',
}];

const makeContext = () => ({
  migration: {
    workingDirectory: '/migration',
  },
  adapter: {
    reposEqual: (r1: IRepo, r2: IRepo) => isEqual(r1, r2),
  },
} as IMigrationContext);

describe('persisted-data', () => {
  beforeEach(() => jestFs.mock({
    '/migration/repos.json': JSON.stringify(reposFixture),
  }));
  afterEach(() => jestFs.restore());

  it('loads repo list from a file', async () => {
    const repos = await loadRepoList(makeContext());
    expect(repos).toEqual([{ owner: 'NerdWallet', name: 'test' }]);
  });

  it('returns null if the file does not exist', async () => {
    await fs.unlinkAsync('/migration/repos.json');
    const repos = await loadRepoList(makeContext());
    expect(repos).toEqual(null);
  });

  it('migrates from a YAML file to a JSON file', async () => {
    const repos = await loadRepoList(makeContext());
    expect(repos).toEqual([{ owner: 'NerdWallet', name: 'test' }]);
  });

  it('creates a new repos file if one does not exist', async () => {
    await fs.unlinkAsync('/migration/repos.json');
    const checkedOutRepos = [{
      name: 'test2',
      owner: 'NerdWallet',
    }];
    const repos = await updateRepoList(makeContext(), checkedOutRepos, []);
    const expected = [{
      name: 'test2',
      owner: 'NerdWallet',
    }];
    expect(repos).toEqual(expected);
    expect(JSON.parse(jestFs.files()['/migration/repos.json'])).toEqual(expected);
  });

  it('removes repo that was discarded', async () => {
    const discardedRepos = [{
      owner: 'NerdWallet',
      name: 'test',
    }];
    const repos = await updateRepoList(makeContext(), [], discardedRepos);
    expect(repos).toEqual([]);
    expect(JSON.parse(jestFs.files()['/migration/repos.json'])).toEqual([]);
  });

  it('adds repo that was checked out', async () => {
    const checkedOutRepos = [{
      name: 'test2',
      owner: 'NerdWallet',
    }];
    const repos = await updateRepoList(makeContext(), checkedOutRepos, []);
    const expected = [{
      name: 'test',
      owner: 'NerdWallet',
    }, {
      name: 'test2',
      owner: 'NerdWallet',
    }];
    expect(repos).toEqual(expected);
    expect(JSON.parse(jestFs.files()['/migration/repos.json'])).toEqual(expected);
  });

  it('removes and adds repos at the same time', async () => {
    const checkedOutRepos = [{
      name: 'test2',
      owner: 'NerdWallet',
    }];
    const discardedRepos = [{
      name: 'test',
      owner: 'NerdWallet',
    }];
    const repos = await updateRepoList(makeContext(), checkedOutRepos, discardedRepos);
    const expected = [{
      owner: 'NerdWallet',
      name: 'test2',
    }];
    expect(repos).toEqual(expected);
    expect(JSON.parse(jestFs.files()['/migration/repos.json'])).toEqual(expected);
  });
});

describe('persisted-data migration', () => {
  beforeEach(() => jestFs.mock({
    '/migration/repos.yml': yaml.dump(reposFixture),
  }));
  afterEach(() => jestFs.restore());

  it('migrates from a YAML file to a JSON file when loadRepoList is called', async () => {
    const repos = await loadRepoList(makeContext());
    expect(JSON.parse(jestFs.files()['/migration/repos.json'])).toEqual(reposFixture);
    expect(jestFs.files()['/migration/repos.yml']).toBe(undefined);
  });

  it('migrates from a YAML file to a JSON file when updateRepoList is called', async () => {
    await updateRepoList(makeContext(), [], []);
    expect(JSON.parse(jestFs.files()['/migration/repos.json'])).toEqual(reposFixture);
    expect(jestFs.files()['/migration/repos.yml']).toBe(undefined);
  });
});
