import { IMigrationContext } from '../migration-context';
import execInRepo from '../util/exec-in-repo';
import forEachRepo from '../util/for-each-repo';

export default async (context: IMigrationContext): Promise<void> => {
  const {
    migration: { spec, repos },
    adapter,
    logger,
  } = context;

  forEachRepo(context, async (repo) => {
    const spinner = logger.spinner('Running apply steps');
    let applySucceeded = true;
    for (const step of (spec.apply || [])) {
      try {
        await execInRepo(adapter, repo, step);
      } catch (e) {
        applySucceeded = false;
        logger.error(e.stderr.trim());
        spinner.fail(`apply step exited with exit code ${e.code}`);
        break;
      }
    }

    if (!applySucceeded) {
      // TODO handle this - reset repository?
    } else {
      spinner.succeed('Completed all apply steps successfully');
    }
  });
};
