/* eslint-env jest */
import fs from 'fs-extra';

import { isEqual } from 'lodash';
import path from 'path';

import { IRepo } from '../adapters/base';
import { IMigrationContext } from '../migration-context';
import { loadRepoList, updateRepoList } from './persisted-data';


const makeContext = (workingDirectory: string) => ({
  migration: {
    workingDirectory,
  },
  adapter: {
    reposEqual: (r1: IRepo, r2: IRepo) => isEqual(r1, r2),
  },
} as IMigrationContext);

describe('persisted-data', () => {

  it('loads repo list from a file', async () => {

    const workingDirectory = path.join(__dirname, '../../fixtures/artifacts/.shepherd/load-repo-from-file/');
    const repos = await loadRepoList(makeContext(workingDirectory));
    expect(repos).toEqual([{'defaultBranch': 'master', 'name': 'shepherd', 'owner': 'NerdWalletOSS'}]);
  });

  it('returns null if the file does not exist', async () => {

    const workingDirectory = path.join(__dirname, '../../fixtures/artifacts/.shepherd/no-repos-json/');
    const repos = await loadRepoList(makeContext(workingDirectory));
    expect(repos).toEqual(null);
  });

  it('migrates from a YAML file to a JSON file', async () => {

    const workingDirectory = path.join(__dirname, '../../fixtures/artifacts/.shepherd/yaml-to-json/');
    const source = path.join(workingDirectory, 'repos-artifact.yml');
    const destination = path.join(workingDirectory, 'repos.yml');
    fs.copyFileSync(source, destination);
    const repos = await loadRepoList(makeContext(workingDirectory));
    fs.unlinkSync(path.join(workingDirectory, 'repos.json'));
    expect(repos).toEqual([{'defaultBranch': 'master', 'name': 'shepherd', 'owner': 'NerdWalletOSS'}]);
  });

  it('creates a new repos file if one does not exist', async () => {

    const workingDirectory = path.join(__dirname, '../../fixtures/artifacts/.shepherd/creates-new-repos-file/');
    const checkedOutRepos = [{
      name: 'test2',
      owner: 'NerdWallet',
    }];
    const repos = await updateRepoList(makeContext(workingDirectory), checkedOutRepos, []);
    const expected = [{
      name: 'test2',
      owner: 'NerdWallet',
    }];
    expect(repos).toEqual(expected);
    const filePath = path.join(workingDirectory,'repos.json');
    const result = JSON.parse((await fs.readFile(filePath)).toString());
    fs.unlinkSync(filePath);
    expect(result).toEqual(expected);
  });

  it('removes repo that was discarded', async () => {

    const workingDirectory = path.join(__dirname, '../../fixtures/artifacts/.shepherd/removes-repo/');
    const discardedRepos = [{
      owner: 'NerdWallet',
      name: 'test',
    }];
    const repos = await updateRepoList(makeContext(workingDirectory), [], discardedRepos);
    const filePath = path.join(workingDirectory, 'repos.json');
    const result = JSON.parse((await fs.readFile(filePath)).toString());
    fs.unlinkSync(filePath);
    expect(repos).toEqual([]);
    expect(result).toEqual([]);
  });

  it('adds repo that was checked out', async () => {

    const workingDirectory = path.join(__dirname, '../../fixtures/artifacts/.shepherd/adds-checked-out-repo/');
    const source = path.join(workingDirectory, 'repos-org.json');
    const destination = path.join(workingDirectory, 'repos.json');
    fs.copyFileSync(source, destination);
    const checkedOutRepos = [
     {
      name: 'test2',
      owner: 'NerdWallet',
    }];
    await updateRepoList(makeContext(workingDirectory), checkedOutRepos, [{
      name: 'test',
      owner: 'NerdWallet',
    }]);
    const expected = [{
      name: 'test2',
      owner: 'NerdWallet',
    }];
    const filePath = path.join(workingDirectory, 'repos.json');
    const result = JSON.parse((await fs.readFile(filePath)).toString());
    fs.unlinkSync(filePath);
    expect(result).toEqual(expected);
  });

  it('removes and adds repos at the same time', async () => {

    const workingDirectory = path.join(__dirname, '../../fixtures/artifacts/.shepherd/removes-adds-repos/');
    const checkedOutRepos = [{
      name: 'test2',
      owner: 'NerdWallet',
    }];
    const discardedRepos = [{
      name: 'test',
      owner: 'NerdWallet',
    }];
    const repos = await updateRepoList(makeContext(workingDirectory), checkedOutRepos, discardedRepos);
    const expected = [{
      owner: 'NerdWallet',
      name: 'test2',
    }];
    expect(repos).toEqual(expected);
    const filePath = path.join(workingDirectory, 'repos.json');
    const result = JSON.parse((await fs.readFile(filePath)).toString());
    fs.unlinkSync(filePath);
    expect(result).toEqual(expected);
  });
});