import { IRepo } from '../adapters/base';
import { IMigrationContext } from '../migration-context';
import executeSteps, { IStepsResults } from './execute-steps';

export default (results: IStepsResults): string => {
  return results.stepResults.map((r) => r.stdout).filter((r) => r).join('').trim();
};
