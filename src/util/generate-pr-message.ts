import { IStepsResults } from './execute-steps.js';

const generate = (results: IStepsResults): string => {
  return results.stepResults
    .map((r) => r.stdout)
    .filter((r) => r)
    .join('')
    .trim();
};

export default generate;

export const generatePrMessageWithFooter = (results: IStepsResults): string => {
  let msg = generate(results);
  // We'll add a friendly footer too
  msg += '\n\n---\n\n';
  msg +=
    '*This change was executed automatically with [Shepherd](https://github.com/NerdWalletOSS/shepherd).* 💚🤖';
  return msg;
};
