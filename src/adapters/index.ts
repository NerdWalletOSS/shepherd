import BaseAdapter from './base';
import GithubAdapter from './github';
import { MigrationContext } from '../migration-context';

export function adapterForName(name: string, context: MigrationContext): BaseAdapter {
  switch (name) {
    case 'github':
      return new GithubAdapter(context);
    default:
      throw new Error(`Unknown adapter: ${name}`);
  }
}
