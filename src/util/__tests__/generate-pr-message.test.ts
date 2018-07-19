import { IStepsResults } from '../execute-steps';
import generatePrMessage from '../generate-pr-message';

const specs = [{
  name: 'handles empty results',
  stepOutput: [],
  expected: '',
}, {
  name: 'handles a single step',
  stepOutput: [ 'hello, world!' ],
  expected: 'hello, world!',
}, {
  name: 'strips trailing newlines from single step',
  stepOutput: [ 'hello, world!\n\n' ],
  expected: 'hello, world!',
}, {
  name: 'handles multiple steps',
  stepOutput: [
    'hello, world!\n',
    'goodbye, world.',
  ],
  expected: 'hello, world!\ngoodbye, world.',
}, {
  name: 'maintains newlines between steps',
  stepOutput: [
    'hello, world!\n\n\n',
    'goodbye, world.',
  ],
  expected: 'hello, world!\n\n\ngoodbye, world.',
}, {
  name: 'excludes empty steps',
  stepOutput: [
    'hello, world!\n',
    '',
    undefined,
    'goodbye, world.',
  ],
  expected: 'hello, world!\ngoodbye, world.',
}];

describe('generate-pr-message', () => {
  specs.forEach((spec) => {
    it(spec.name, async () => {
      const results: IStepsResults = {
        succeeded: true,
        stepResults: spec.stepOutput.map((s) => ({
          step: 'test',
          succeeded: true,
          stdout: s,
        })),
      };
      expect(generatePrMessage(results)).toEqual(spec.expected);
    });
  });
});
