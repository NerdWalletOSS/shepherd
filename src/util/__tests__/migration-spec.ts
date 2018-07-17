/* eslint-env jest */
import path from 'path';
import { loadSpec } from '../migration-spec';

const getSpecDirectory = (name: string) => path.join(__dirname, '..', '__fixtures__', 'specs', name);

describe('spec', () => {
  it('loads a simple spec', () => {
    const spec = loadSpec(getSpecDirectory('basic'));
    expect(spec).toEqual({
      name: 'testspec',
      adapter: 'github',
      search_query: 'filename:package.json',
      apply: [
        'echo hi',
        'echo bye',
      ],
    });
  });

  it('converts single-step hooks to arrays', () => {
    const spec = loadSpec(getSpecDirectory('single-steps'));
    expect(spec).toEqual({
      name: 'testspec',
      adapter: 'github',
      search_query: 'filename:package.json',
      should_migrate: ['echo 1'],
      post_checkout: ['echo 2'],
      apply: ['echo 3'],
      pr_message: ['echo 4'],
    });
  });
});
