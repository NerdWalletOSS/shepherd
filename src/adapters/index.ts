import { IMigrationContext } from '../migration-context.js';
import IRepoAdapter from './base.js';
import GithubAdapter from './github.js';
import GithubService from '../services/github.js';

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
