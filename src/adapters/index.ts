import { IMigrationContext } from '../migration-context';
import IRepoAdapter from './base';
import GithubAdapter from './github';
import GithubService from '../services/github';

export function adapterForName(name: string, context: IMigrationContext): IRepoAdapter {
  switch (name) {
    case 'github': {
      const githubService = new GithubService(context);
      return new GithubAdapter(context, githubService);
    }
    default:
      throw new Error(`Unknown adapter: ${name}`);
  }
}
