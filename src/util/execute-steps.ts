import chalk from 'chalk';
import { IRepo } from '../adapters/base';
import { IMigrationContext } from '../migration-context';
import execInRepo from '../util/exec-in-repo';

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

export default async (
  context: IMigrationContext,
  repo: IRepo,
  phase: string,
  showOutput = true
): Promise<IStepsResults> => {
  const {
    migration: {
      spec: { hooks },
    },
    logger,
  } = context;

  const results: IStepsResults = {
    succeeded: false,
    stepResults: [],
  };

  const steps = hooks[phase] || [];
  for (const step of steps) {
    logger.info(`\$ ${step}`);
    try {
      const { promise, childProcess } = await execInRepo(context, repo, step);
      if (showOutput) {
        childProcess.stdout?.on('data', (out) => logger.info(out.toString().trim()));
      }
      childProcess.stderr?.on('data', (out) => logger.info(out.toString().trim()));
      const childProcessResult = await promise;
      logger.info(chalk.green(`Step "${step}" exited with 0`));
      results.stepResults.push({
        step,
        succeeded: true,
        stdout: childProcessResult.stdout,
        stderr: childProcessResult.stderr,
      });
    } catch (e: any) {
      // This could either be an error from the process itself (which will have an exit code)
      // or an error from JavaScript world (e.g. the script wasn't executable)
      if (e.code !== undefined) {
        logger.warn(`Step "${step}" exited with ${e.code}`);
      } else {
        logger.error(e);
      }
      results.stepResults.push({
        step,
        succeeded: false,
        stdout: e.stdout,
        stderr: e.stderr,
      });
      return results;
    }
  }

  results.succeeded = true;
  return results;
};
