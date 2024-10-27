import generate, { generatePrMessageWithFooter } from './generate-pr-message';
import { IStepsResults } from './execute-steps';

describe('generate', () => {
  it('should concatenate stdout of stepResults and trim the result', () => {
    const results: IStepsResults = {
      stepResults: [
        {
          stdout: 'First step output ',
          step: '',
          succeeded: false,
        },
        {
          stdout: 'Second step output ',
          step: '',
          succeeded: false,
        },
        {
          stdout: 'Third step output',
          step: '',
          succeeded: false,
        },
      ],
      succeeded: false,
    };

    const message = generate(results);
    expect(message).toBe('First step output Second step output Third step output');
  });

  it('should return an empty string if all stepResults are empty', () => {
    const results: IStepsResults = {
      stepResults: [
        {
          stdout: '',
          step: '',
          succeeded: false,
        },
        {
          stdout: '',
          step: '',
          succeeded: false,
        },
        {
          stdout: '',
          step: '',
          succeeded: false,
        },
      ],
      succeeded: false,
    };

    const message = generate(results);
    expect(message).toBe('');
  });

  it('should filter out empty stdout and concatenate non-empty stdout', () => {
    const results: IStepsResults = {
      stepResults: [
        {
          stdout: 'First step output ',
          step: '',
          succeeded: false,
        },
        {
          stdout: '',
          step: '',
          succeeded: false,
        },
        {
          stdout: 'Third step output',
          step: '',
          succeeded: false,
        },
      ],
      succeeded: false,
    };

    const message = generate(results);
    expect(message).toBe('First step output Third step output');
  });
});

describe('generatePrMessageWithFooter', () => {
  it('should append a footer to the generated message', () => {
    const results: IStepsResults = {
      succeeded: false,
      stepResults: [
        { stdout: 'First step output ', step: '', succeeded: false },
        { stdout: 'Second step output ', step: '', succeeded: false },
        { stdout: 'Third step output', step: '', succeeded: false },
      ],
    };

    const message = generatePrMessageWithFooter(results);
    expect(message).toBe(
      'First step output Second step output Third step output\n\n---\n\n*This change was executed automatically with [Shepherd](https://github.com/NerdWalletOSS/shepherd).* 💚🤖'
    );
  });

  it('should handle empty stepResults and still append a footer', () => {
    const results: IStepsResults = {
      stepResults: [
        {
          stdout: '',
          step: '',
          succeeded: false,
        },
        {
          stdout: '',
          step: '',
          succeeded: false,
        },
        {
          stdout: '',
          step: '',
          succeeded: false,
        },
      ],
      succeeded: false,
    };

    const message = generatePrMessageWithFooter(results);
    expect(message).toBe(
      '\n\n---\n\n*This change was executed automatically with [Shepherd](https://github.com/NerdWalletOSS/shepherd).* 💚🤖'
    );
  });
});
