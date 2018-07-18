import { ChildProcessPromise } from 'child-process-promise';
import util from 'util';
import chalk from '../../node_modules/chalk';
import { IRepo } from '../adapters/base';
import { IMigrationContext } from '../migration-context';
import execInRepo from '../util/exec-in-repo';

export default async (context: IMigrationContext, repo: IRepo, phase: string): Promise<boolean> => {
  const {
    migration: {
      spec: {
        hooks,
      },
    },
    adapter,
    logger,
  } = context;
  const steps = hooks[phase] || [];
  for (const step of steps) {
    logger.info(`\$ ${step}`);
    try {
      const { promise, childProcess } = await execInRepo(adapter, repo, step);
      childProcess.stdout.on('data', (out) => logger.info(out.toString().trim()));
      childProcess.stderr.on('data', (out) => logger.info(out.toString().trim()));
      await promise;
      logger.info(chalk.green(`Step "${step}" exited with 0\n`));
    } catch (e) {
      logger.warn(`Step "${step}" exited with ${e.code}\n`);
      return false;
    }
  }

  return true;
};
