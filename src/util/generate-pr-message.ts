import { IStepsResults } from './execute-steps';

const generate = (results: IStepsResults): string => {
  return results.stepResults.map((r) => r.stdout).filter((r) => r).join('').trim();
};

export default generate;

export const generatePrMessageWithFooter = (results: IStepsResults): string => {
  let message = generate(results);
  // We'll add a friendly footer too
  message += '\n\n---\n\n';
  message += '*This change was executed automatically with [Shepherd](https://github.com/NerdWalletOSS/shepherd).* 💚🤖';
  return message;
};
