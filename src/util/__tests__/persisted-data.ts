/* eslint-env jest */
import fs from 'jest-plugin-fs';
import { isEqual } from 'lodash';
import path from 'path';
import { IRepo } from '../../adapters/base';

import { IMigrationContext } from '../../migration-context';
import { loadRepoList, updateRepoList } from '../persisted-data';

jest.mock('fs', () => require('jest-plugin-fs/mock')); // eslint-disable-line global-require

const getFixture = (name: string) => fs.read(path.join(__dirname, '..', '__fixtures__', `${name}.yml`));

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
      name: 'test2',
      owner: 'NerdWallet',
    }];
    const repos = updateRepoList(makeContext(), checkedOutRepos, []);
    expect(repos).toEqual([{
      name: 'test',
      owner: 'NerdWallet',
    }, {
      name: 'test2',
      owner: 'NerdWallet',
    }]);
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
    const repos = updateRepoList(makeContext(), checkedOutRepos, discardedRepos);
    expect(repos).toEqual([{ owner: 'NerdWallet', name: 'test2' }]);
  });
});
