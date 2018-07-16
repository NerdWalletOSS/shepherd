/* eslint-env jest */
const path = require('path');
const fs = require('jest-plugin-fs').default;
const { isEqual } = require('lodash');


const { loadRepoList, updateRepoList } = require('../persisted-data');

jest.mock('fs', () => require('jest-plugin-fs/mock')); // eslint-disable-line global-require

const getFixture = name => fs.read(path.join(__dirname, '..', '__fixtures__', `${name}.yml`));

const makeContext = () => ({
  migration: {
    workingDirectory: '/migration',
    adapter: {
      reposEqual: (r1, r2) => isEqual(r1, r2),
    },
  },
});

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
