import { IMigrationContext } from '../migration-context';
import IRepoAdapter from './base';
import GithubAdapter from './github';

export function adapterForName(name: string, context: IMigrationContext): IRepoAdapter {
  switch (name) {
    case 'github':
      return new GithubAdapter(context);
    default:
      throw new Error(`Unknown adapter: ${name}`);
  }
}
