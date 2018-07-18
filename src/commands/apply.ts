import { IMigrationContext } from '../migration-context';
import execInRepo from '../util/exec-in-repo';
import executeSteps from '../util/execute-steps';
import forEachRepo from '../util/for-each-repo';

export default async (context: IMigrationContext): Promise<void> => {
  const {
    migration: { spec, repos },
    adapter,
    logger,
  } = context;

  forEachRepo(context, async (repo) => {
    logger.info('> Running apply steps');
    const applySucceeded = executeSteps(context, repo, 'apply');
    if (!applySucceeded) {
      // TODO handle this - reset repository?
    } else {
      logger.info('> Completed all apply steps successfully');
    }
  });
};
