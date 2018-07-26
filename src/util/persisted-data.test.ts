/* eslint-env jest */
import fs from 'jest-plugin-fs';
import yaml from 'js-yaml';
import { isEqual } from 'lodash';
import path from 'path';

import { IRepo } from '../adapters/base';
import { IMigrationContext } from '../migration-context';
import { loadRepoList, updateRepoList } from './persisted-data';

jest.mock('fs', () => require('jest-plugin-fs/mock')); // eslint-disable-line global-require

const getFixture = (name: string) => fs.read(path.join(__dirname, '__fixtures__', `${name}.yml`));

const makeContext = () => ({
  migration: {
    workingDirectory: '/migration',
  },
  adapter: {
    reposEqual: (r1: IRepo, r2: IRepo) => isEqual(r1, r2),
  },
} as IMigrationContext);

describe('persisted-data', () => {
  beforeEach(() => fs.mock({
    '/migration/repos.yml': getFixture('repos'),
  }));
  afterEach(() => fs.restore());

  it('loads repo list from a file', async () => {
    const repos = await loadRepoList(makeContext());
    expect(repos).toEqual([{ owner: 'NerdWallet', name: 'test' }]);
  });

  it('removes repo that was discarded', async () => {
    const discardedRepos = [{
      owner: 'NerdWallet',
      name: 'test',
    }];
    const repos = await updateRepoList(makeContext(), [], discardedRepos);
    expect(repos).toEqual([]);
    expect(yaml.safeLoad(fs.files()['/migration/repos.yml'])).toEqual([]);
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
    expect(yaml.safeLoad(fs.files()['/migration/repos.yml'])).toEqual(expected);
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
    expect(yaml.safeLoad(fs.files()['/migration/repos.yml'])).toEqual(expected);
  });
});
