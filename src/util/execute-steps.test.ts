import executeSteps, { IStepsResults } from './execute-steps';
import { IMigrationContext } from '../migration-context';
import { IRepo } from '../adapters/base';
import execInRepo from '../util/exec-in-repo';

jest.mock('../util/exec-in-repo');

describe('executeSteps', () => {
  let context: IMigrationContext;
  let repo: IRepo;

  beforeEach(() => {
    context = {
      migration: {
        spec: {
          hooks: {
            preDeploy: ['echo "preDeploy step 1"', 'echo "preDeploy step 2"'],
            postDeploy: ['echo "postDeploy step 1"'],
          },
        },
      },
      logger: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      },
    } as unknown as IMigrationContext;

    repo = {} as IRepo;

    (execInRepo as jest.Mock).mockReset();
  });

  it('should execute all steps successfully', async () => {
    // @ts-ignore
    (execInRepo as jest.Mock).mockImplementation((context, repo, step) => {
      return {
        promise: Promise.resolve({ stdout: 'output', stderr: '' }),
        childProcess: {
          stdout: {
            on: jest.fn(),
          },
          stderr: {
            on: jest.fn(),
          },
        },
      };
    });

    const results: IStepsResults = await executeSteps(context, repo, 'preDeploy');

    expect(results.succeeded).toBe(true);
    expect(results.stepResults).toHaveLength(2);
    expect(results.stepResults[0].succeeded).toBe(true);
    expect(results.stepResults[1].succeeded).toBe(true);
  });

  it('should handle step failure', async () => {
    // @ts-ignore
    (execInRepo as jest.Mock).mockImplementation((context, repo, step) => {
      if (step === 'echo "preDeploy step 2"') {
        return {
          promise: Promise.reject({ code: 1, stdout: '', stderr: 'error' }),
          childProcess: {
            stdout: {
              on: jest.fn(),
            },
            stderr: {
              on: jest.fn(),
            },
          },
        };
      }
      return {
        promise: Promise.resolve({ stdout: 'output', stderr: '' }),
        childProcess: {
          stdout: {
            on: jest.fn(),
          },
          stderr: {
            on: jest.fn(),
          },
        },
      };
    });

    const results: IStepsResults = await executeSteps(context, repo, 'preDeploy');

    expect(results.succeeded).toBe(false);
    expect(results.stepResults).toHaveLength(2);
    expect(results.stepResults[0].succeeded).toBe(true);
    expect(results.stepResults[1].succeeded).toBe(false);
  });

  it('should handle no steps', async () => {
    const results: IStepsResults = await executeSteps(context, repo, 'nonExistentPhase');

    expect(results.succeeded).toBe(true);
    expect(results.stepResults).toHaveLength(0);
  });

  it('should log stdout and stderr output', async () => {
    const mockStdoutOn = jest.fn((event, callback) => {
      if (event === 'data') {
        callback('stdout data');
      }
    });
    const mockStderrOn = jest.fn((event, callback) => {
      if (event === 'data') {
        callback('stderr data');
      }
    });
    // @ts-ignore
    (execInRepo as jest.Mock).mockImplementation((context, repo, step) => {
      return {
        promise: Promise.resolve({ stdout: 'output', stderr: '' }),
        childProcess: {
          stdout: {
            on: mockStdoutOn,
          },
          stderr: {
            on: mockStderrOn,
          },
        },
      };
    });

    await executeSteps(context, repo, 'preDeploy');

    expect(context.logger.info).toHaveBeenCalledWith('stdout data');
    expect(context.logger.info).toHaveBeenCalledWith('stderr data');
  });

  it('should handle JavaScript errors', async () => {
    (execInRepo as jest.Mock).mockImplementation(() => {
      throw new Error('JavaScript error');
    });

    const results: IStepsResults = await executeSteps(context, repo, 'preDeploy');

    expect(results.succeeded).toBe(false);
    expect(results.stepResults).toHaveLength(1);
    expect(results.stepResults[0].succeeded).toBe(false);
    expect(context.logger.error).toHaveBeenCalledWith(expect.any(Error));
  });

  it('should not log output if showOutput is false', async () => {
    // @ts-ignore
    (execInRepo as jest.Mock).mockImplementation((context, repo, step) => {
      return {
        promise: Promise.resolve({ stdout: 'output', stderr: '' }),
        childProcess: {
          stdout: {
            on: jest.fn(),
          },
          stderr: {
            on: jest.fn(),
          },
        },
      };
    });

    await executeSteps(context, repo, 'preDeploy', false);

    expect(context.logger.info).not.toHaveBeenCalledWith('stdout data');
    expect(context.logger.info).not.toHaveBeenCalledWith('stderr data');
  });
});
