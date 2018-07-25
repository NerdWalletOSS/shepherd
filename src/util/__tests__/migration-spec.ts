/* eslint-env jest */
import { cloneDeep } from 'lodash';
import { normalizeSpec, validateSpec } from '../migration-spec';

describe('normalizeSpec', () => {
  it('loads a simple spec', () => {
    const spec = {
      id: 'testspec',
      adapter: 'github',
      search_query: 'filename:package.json',
      hooks: {
        apply: [
          'echo hi',
          'echo bye',
        ],
      },
    };
    expect(normalizeSpec(spec)).toEqual({
      id: 'testspec',
      adapter: 'github',
      search_query: 'filename:package.json',
      hooks: {
        apply: [
          'echo hi',
          'echo bye',
        ],
      },
    });
  });

  it('converts single-step hooks to arrays', () => {
    const spec = {
      name: 'testspec',
      adapter: 'github',
      search_query: 'filename:package.json',
      hooks: {
        should_migrate: 'echo 1',
        post_checkout: 'echo 2',
        apply: 'echo 3',
        pr_message: 'echo 4',
      },
    };
    expect(normalizeSpec(spec)).toEqual({
      name: 'testspec',
      adapter: 'github',
      search_query: 'filename:package.json',
      hooks: {
        should_migrate: ['echo 1'],
        post_checkout: ['echo 2'],
        apply: ['echo 3'],
        pr_message: ['echo 4'],
      },
    });
  });
});

describe('validateSpec', () => {
  const baseSpec = {
    id: 'testspec',
    title: 'Test spec',
    adapter: 'github',
    search_query: 'filename:package.json',
    hooks: {
      apply: [
        'echo hi',
        'echo bye',
      ],
    },
  };

  it('accepts a valid spec', () => {
    const spec = cloneDeep(baseSpec);
    expect(validateSpec(spec).error).toBe(null);
  });

  ['id', 'title', 'adapter', 'search_query'].forEach((prop) => {
    it(`rejects a spec with a missing ${prop}`, () => {
      const spec = cloneDeep(baseSpec) as any;
      delete spec[prop];
      expect(validateSpec(spec).error).not.toBe(null);
    });
  });
});
