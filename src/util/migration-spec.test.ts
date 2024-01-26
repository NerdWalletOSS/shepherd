/* eslint-env jest */
import { cloneDeep } from 'lodash';
import { normalizeSpec, validateSpec } from './migration-spec';

describe('normalizeSpec', () => {
  it('loads a simple spec', () => {
    const spec = {
      id: 'testspec',
      adapter: {
        type: 'github',
        search_query: 'filename:package.json',
      },
      hooks: {
        apply: ['echo hi', 'echo bye'],
      },
    };
    expect(normalizeSpec(spec)).toEqual(spec);
  });

  it('creates a deep copy of the spec and does not modify the original', () => {
    const spec = {
      id: 'testspec',
      adapter: {
        type: 'github',
        search_query: 'filename:package.json',
      },
      hooks: {
        apply: 'echo hi',
      },
    };
    const originalSpec = cloneDeep(spec);
    expect(normalizeSpec(spec)).not.toBe(spec);
    expect(spec).toEqual(originalSpec);
  });

  it('converts single-step hooks to arrays', () => {
    const spec = {
      name: 'testspec',
      adapter: {
        type: 'github',
        search_query: 'filename:package.json',
      },
      hooks: {
        should_migrate: 'echo 1',
        post_checkout: 'echo 2',
        apply: 'echo 3',
        pr_message: 'echo 4',
        issue_message: 'echo 4',
        issue_labels: ['enhancements', 'bug'],
      },
    };
    expect(normalizeSpec(spec)).toEqual({
      name: 'testspec',
      adapter: {
        type: 'github',
        search_query: 'filename:package.json',
      },
      hooks: {
        should_migrate: ['echo 1'],
        post_checkout: ['echo 2'],
        apply: ['echo 3'],
        pr_message: ['echo 4'],
        issue_message: ['echo 4'],
        issue_labels: ['enhancements', 'bug'],
      },
    });
  });
});

describe('validateSpec', () => {
  const baseSpec = {
    id: 'testspec',
    title: 'Test spec',
    adapter: {
      type: 'github',
      search_query: 'filename:package.json',
    },
    hooks: {
      apply: ['echo hi', 'echo bye'],
    },
  };

  it('accepts a valid spec', () => {
    const spec = cloneDeep(baseSpec);
    expect(validateSpec(spec).error).toBe(undefined);
  });

  ['id', 'title', 'adapter'].forEach((prop) => {
    it(`rejects a spec with a missing ${prop}`, () => {
      const spec = cloneDeep(baseSpec) as any;
      delete spec[prop];
      expect(validateSpec(spec).error).not.toBe(undefined);
    });
  });

  it('rejects a spec with a missing adapter type', () => {
    const spec: any = cloneDeep(baseSpec);
    delete spec.adapter.type;
    expect(validateSpec(spec).error).not.toBe(undefined);
  });
});
