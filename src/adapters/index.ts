import { IMigrationContext } from '../migration-context';
import BaseAdapter from './base';
import GithubAdapter from './github';

export function adapterForName(name: string, context: IMigrationContext): BaseAdapter {
  switch (name) {
    case 'github':
      return new GithubAdapter(context);
    default:
      throw new Error(`Unknown adapter: ${name}`);
  }
}
