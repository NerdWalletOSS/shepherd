import executeSteps from './execute-steps';
import { IMigrationContext } from '../migration-context';
import { IRepo } from '../adapters/base';
import execInRepo from '../util/exec-in-repo';

jest.mock('../util/exec-in-repo');

describe('executeStep', () => {
  let context: IMigrationContext;
  let repo: IRepo;
  let repoLogs: string[];

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
    repoLogs = [];

    (execInRepo as jest.Mock).mockReset();
  });

  it('should execute a step successfully', async () => {
    // @ts-ignore
    (execInRepo as jest.Mock).mockImplementation((context, repo, step) => {
      return Promise.resolve({ code: 1, stdout: 'output' });
    });

    const results = await executeSteps(context, repo, 'postDeploy', true, repoLogs);
    expect(results.succeeded).toBe(true);
    expect(results.stepResults[0].stdout).toBe('output');
    expect(results.stepResults[0].stderr).toBe(undefined);
    expect(repoLogs[3]).toContain('Step "echo "postDeploy step 1"" exited with 0');
  });

  it('should handle step failure', async () => {
    // @ts-ignore
    (execInRepo as jest.Mock).mockImplementation((context, repo, step) => {
      return Promise.reject({ code: 1, stdout: '', stderr: 'error' });
    });

    const results = await executeSteps(context, repo, 'postDeploy', true, repoLogs);
    expect(results.succeeded).toBe(false);
    expect(results.stepResults[0].stdout).toBe('');
    expect(results.stepResults[0].stderr).toBe('error');
    expect(repoLogs).toMatchSnapshot();
  });

  xit('should not log output if showOutput is false', async () => {
    // @ts-ignore
    (execInRepo as jest.Mock).mockImplementation((context, repo, step) => {
      return Promise.reject({ code: 1, stdout: '', stderr: 'error' });
    });

    await executeSteps(context, repo, 'preDeploy', false, repoLogs);

    expect(repoLogs).not.toContain('stdout data');
    expect(repoLogs).not.toContain('stderr data');
  });

  it('should handle JavaScript errors', async () => {
    (execInRepo as jest.Mock).mockImplementation(() => {
      throw new Error('JavaScript error');
    });

    const results = await executeSteps(context, repo, 'preDeploy', true, repoLogs);
    expect(results.succeeded).toBe(false);
    expect(results.stepResults[0].stdout).toBeUndefined();
    expect(results.stepResults[0].stderr).toBeUndefined();
    expect(repoLogs).toContain('Error: JavaScript error');
  });
});
