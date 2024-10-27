import chalk from 'chalk';
import { IRepo } from '../adapters/base.js';
import { IMigrationContext } from '../migration-context.js';
import execInRepo from '../util/exec-in-repo.js';

interface IStepResult {
  step: string;
  succeeded: boolean;
  stdout?: string;
  stderr?: string;
}

export interface IStepsResults {
  succeeded: boolean;
  stepResults: IStepResult[];
}

const executeStep = async (
  context: IMigrationContext,
  repo: IRepo,
  step: string,
  showOutput: boolean,
  repoLogs: string[]
): Promise<IStepResult> => {
  repoLogs.push(`\$ ${step}`);

  try {
    const { stdout, stderr } = await execInRepo(context, repo, step);

    if (showOutput) {
      repoLogs.push(stdout);
    }

    repoLogs.push(stderr);
    repoLogs.push(chalk.green(`Step "${step}" exited with 0`));

    return {
      step,
      succeeded: true,
      stdout: stdout,
      stderr: stderr,
    };
  } catch (e: any) {
    if (e.code !== undefined) {
      repoLogs.push(`Step "${step}" exited with ${e.code}`);
    } else {
      repoLogs.push(e.toString());
    }

    return {
      step,
      succeeded: false,
      stdout: e.stdout,
      stderr: e.stderr,
    };
  }
};

/**
 * Executes a series of migration steps for a given phase.
 *
 * @param context - The migration context containing necessary information and configurations.
 * @param repo - The repository interface to interact with the repository.
 * @param phase - The phase of the migration to execute steps for.
 * @param showOutput - Optional flag to determine if output should be shown. Defaults to true.
 * @param repoLogs - Array to collect logs from the repository.
 * @returns A promise that resolves to the results of the executed steps.
 */
export default async (
  context: IMigrationContext,
  repo: IRepo,
  phase: string,
  showOutput = true,
  repoLogs: string[] = []
): Promise<IStepsResults> => {
  const {
    migration: {
      spec: { hooks },
    },
  } = context;

  const results: IStepsResults = {
    succeeded: false,
    stepResults: [],
  };

  const steps = hooks[phase] || [];

  for (const step of steps) {
    const stepResult = await executeStep(context, repo, step, showOutput, repoLogs);
    results.stepResults.push(stepResult);

    if (!stepResult.succeeded) {
      return results;
    }
  }

  results.succeeded = true;
  return results;
};
