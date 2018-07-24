import { IStepsResults } from './execute-steps';

export default (results: IStepsResults): string => {
  let message = results.stepResults.map((r) => r.stdout).filter((r) => r).join('').trim();
  // We'll add a friendly footer too
  message += '\n\n---\n\n';
  message += '*This change was executed automatically with [Shepherd](https://github.com/NerdWallet/shepherd2).* 💚🤖';
  return message;
};
