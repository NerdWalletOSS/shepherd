import ora from 'ora';

import { MigrationContext } from '../migration-context';
import execInRepo from '../util/exec-in-repo';

export default async (context: MigrationContext): Promise<void> => {
  const {
    migration: { spec, repos },
    adapter,
  } = context;

  for (const repo of (repos || [])) {
    console.log(`\n[${adapter.formatRepo(repo)}]`);
    const spinner = ora('Running apply steps').start();
    let applySucceeded = true;
    for (const step of (spec.apply || [])) {
      try {
        await execInRepo(adapter, repo, step);
      } catch (e) {
        applySucceeded = false;
        spinner.clear();
        console.warn(e.stderr);
        spinner.fail(`apply step exited with exit code ${e.code}`);
        break;
      }
    }

    if (!applySucceeded) {
      // TODO handle this - reset repository?
    } else {
      spinner.succeed('should_migrate steps completed successfully');
    }
  }
};
