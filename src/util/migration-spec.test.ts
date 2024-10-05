import { loadSpec, normalizeSpec, validateSpec } from './migration-spec';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

jest.mock('fs');
jest.mock('path');
jest.mock('js-yaml');

describe('migration-spec', () => {
  const mockDirectory = '/mock/directory';
  const mockFilePath = '/mock/directory/shepherd.yml';
  const mockSpec = {
    id: 'test-id',
    title: 'Test Title',
    adapter: {
      type: 'github',
    },
    hooks: {
      should_migrate: ['step1'],
      post_checkout: ['step2'],
      apply: ['step3'],
      pr_message: ['step4'],
    },
  };

  beforeEach(() => {
    (path.join as jest.Mock).mockReturnValue(mockFilePath);
    (fs.readFileSync as jest.Mock).mockReturnValue('mock yaml content');
    (yaml.load as jest.Mock).mockReturnValue(mockSpec);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('loadSpec', () => {
    it('should load and validate the spec', () => {
      const result = loadSpec(mockDirectory);
      expect(path.join).toHaveBeenCalledWith(mockDirectory, 'shepherd.yml');
      expect(fs.readFileSync).toHaveBeenCalledWith(mockFilePath, 'utf8');
      expect(yaml.load).toHaveBeenCalledWith('mock yaml content');
      expect(result).toEqual(mockSpec);
    });

    it('should throw an error if validation fails', () => {
      const invalidSpec = { ...mockSpec, id: undefined };
      (yaml.load as jest.Mock).mockReturnValue(invalidSpec);
      expect(() => loadSpec(mockDirectory)).toThrow('Error loading migration spec');
    });
  });

  describe('normalizeSpec', () => {
    it('should normalize hooks to arrays', () => {
      const originalSpec = {
        ...mockSpec,
        hooks: {
          should_migrate: 'step1',
          post_checkout: ['step2'],
          apply: 'step3',
          pr_message: ['step4'],
        },
      };
      const expectedSpec = {
        ...mockSpec,
        hooks: {
          should_migrate: ['step1'],
          post_checkout: ['step2'],
          apply: ['step3'],
          pr_message: ['step4'],
        },
      };
      const result = normalizeSpec(originalSpec);
      expect(result).toEqual(expectedSpec);
    });

    it('should throw an error for invalid hook types', () => {
      const invalidSpec = {
        ...mockSpec,
        hooks: {
          should_migrate: 123,
        },
      };
      expect(() => normalizeSpec(invalidSpec)).toThrow('Error reading shepherd.yml');
    });
    it('should handle missing hooks gracefully', () => {
      const originalSpec = {
        ...mockSpec,
        hooks: undefined,
      };
      const expectedSpec = {
        ...mockSpec,
        hooks: {},
      };
      const result = normalizeSpec(originalSpec);
      expect(result).toEqual(expectedSpec);
    });
  });

  describe('validateSpec', () => {
    it('should validate a correct spec', () => {
      const result = validateSpec(mockSpec);
      expect(result.error).toBeUndefined();
    });

    it('should return an error for an invalid spec', () => {
      const invalidSpec = { ...mockSpec, id: undefined };
      const result = validateSpec(invalidSpec);
      expect(result.error).toBeDefined();
    });
  });
});
