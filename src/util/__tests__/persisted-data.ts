/* eslint-env jest */
import path from 'path';
import fs from 'jest-plugin-fs';
import { isEqual } from 'lodash';
import { Repo } from '../../adapters/base';


import { loadRepoList, updateRepoList } from '../persisted-data';
import { MigrationContext } from '../../migration-context';

jest.mock('fs', () => require('jest-plugin-fs/mock')); // eslint-disable-line global-require

const getFixture = (name: string) => fs.read(path.join(__dirname, '..', '__fixtures__', `${name}.yml`));

const makeContext = () => ({
  migration: {
    workingDirectory: '/migration',
  },
  adapter: {
    reposEqual: (r1: Repo, r2: Repo) => isEqual(r1, r2),
  },
} as MigrationContext);

describe('persisted-data', () => {
  beforeEach(() => fs.mock({
    '/migration/repos.yml': getFixture('repos'),
  }));
  afterEach(() => fs.restore());

  it('loads repo list from a file', async () => {
    const repos = loadRepoList(makeContext());
    expect(repos).toEqual([{ owner: 'NerdWallet', name: 'test' }]);
  });

  it('removes repo that was discarded', async () => {
    const discardedRepos = [{
      owner: 'NerdWallet',
      name: 'test',
    }];
    const repos = updateRepoList(makeContext(), [], discardedRepos);
    expect(repos).toEqual([]);
  });

  it('adds repo that was checked out', async () => {
    const checkedOutRepos = [{
      owner: 'NerdWallet',
      name: 'test2',
    }];
    const repos = updateRepoList(makeContext(), checkedOutRepos, []);
    expect(repos).toEqual([{
      owner: 'NerdWallet',
      name: 'test',
    }, {
      owner: 'NerdWallet',
      name: 'test2',
    }]);
  });

  it('removes and adds repos at the same time', async () => {
    const checkedOutRepos = [{
      owner: 'NerdWallet',
      name: 'test2',
    }];
    const discardedRepos = [{
      owner: 'NerdWallet',
      name: 'test',
    }];
    const repos = updateRepoList(makeContext(), checkedOutRepos, discardedRepos);
    expect(repos).toEqual([{ owner: 'NerdWallet', name: 'test2' }]);
  });
});
