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
    const spinner = logger.spinner(`\$ ${step}`);
    try {
      await execInRepo(adapter, repo, step);
      spinner.succeed();
    } catch (e) {
      logger.error(e.stderr.trim());
      spinner.warn(`should_migrate step exited with exit code ${e.code}`);
      return false;
    }
  }

  return true;
};
