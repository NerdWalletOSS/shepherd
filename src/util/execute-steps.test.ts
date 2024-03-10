import mockAdapter from '../adapters/adapter.mock';
import { IRepo } from '../adapters/base';
import mockLogger from '../logger/logger.mock';
import { IMigrationContext } from '../migration-context';
import executeSteps, { IStepsResults } from './execute-steps';
import * as execInRepo from './exec-in-repo';

describe('executeSteps', () => {
  let mockContext: IMigrationContext;
  let mockRepo: IRepo;

  beforeEach(() => {
    jest.resetAllMocks();
    mockContext = {
      shepherd: {
        workingDirectory: 'workingDirectory',
      },
      migration: {
        migrationDirectory: 'migrationDirectory',
        spec: {
          id: 'id',
          title: 'title',
          adapter: {
            type: 'adapter',
          },
          hooks: {},
        },
        workingDirectory: 'workingDirectory',
        selectedRepos: [{ name: 'selectedRepos' }],
        repos: [{ name: 'selectedRepos' }],
        upstreamOwner: 'upstreamOwner',
      },
      adapter: mockAdapter,
      logger: mockLogger,
    };

    mockRepo = {
      // Mock implementation of IRepo
    };
  });

  it('handles non-empty hooks', async () => {
    mockContext.migration.spec.hooks = {
      pre: ['echo "pre hook"'],
      post: ['echo "post hook"'],
    };

    const result: IStepsResults = await executeSteps(mockContext, mockRepo, 'pre');
    expect(result.succeeded).toBe(true);
    expect(result.stepResults).toHaveLength(1);
  });

  it('handles execInRepo errors with error code', async () => {
    mockContext.migration.spec.hooks = {
      pre: ['echo "pre hook"'],
      post: ['echo "post hook"'],
    };

    jest
      .spyOn(execInRepo, 'default')
      .mockRejectedValue(Object.assign(new Error('execInRepo error'), { code: 1 }));

    const result: IStepsResults = await executeSteps(mockContext, mockRepo, 'pre');
    expect(result.succeeded).toBe(false);
    expect(result.stepResults).toHaveLength(1);
    expect(result.stepResults[0].succeeded).toBe(false);
  });

  it('handles execInRepo errors without error code', async () => {
    mockContext.migration.spec.hooks = {
      pre: ['echo "pre hook"'],
      post: ['echo "post hook"'],
    };

    jest.spyOn(execInRepo, 'default').mockRejectedValue(new Error('execInRepo error'));

    const result: IStepsResults = await executeSteps(mockContext, mockRepo, 'pre');
    expect(result.succeeded).toBe(false);
    expect(result.stepResults).toHaveLength(1);
    expect(result.stepResults[0].succeeded).toBe(false);
  });
});
