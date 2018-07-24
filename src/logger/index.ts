import chalk from 'chalk';
import logSymbols from 'log-symbols';
import ora from 'ora';
import { format } from 'util';

export interface ISpinner {
  start(): void;
  stop(): void;
  succeed(text?: string): void;
  fail(text?: string): void;
  warn(text?: string): void;
  info(text?: string): void;
  clear(): void;
  render(): void;
}

export interface ILogger {
  // Basic logging
  debug(message: string): void;
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
  fatal(message: string): void;

  // Logging with fancy icons
  succeedIcon(message: string): void;
  failIcon(message: string): void;
  warnIcon(message: string): void;
  infoIcon(message: string): void;

  // Support for progress spinners
  spinner(message: string): ISpinner;
}

export default class ConsoleLogger implements ILogger {
  private oraInstance: any = null;
  private spinnerActive = false;

  public debug = (message: string): void => {
    this.log('debug', message);
  }

  public info = (message: string): void => {
    this.log('info', message);
  }

  public warn = (message: string): void => {
    this.log('warn', message);
  }

  public error = (message: string): void => {
    this.log('error', message);
  }

  public fatal = (message: string): void => {
    this.log('fatal', message);
  }

  public succeedIcon = (message: string): void => {
    this.info(`${logSymbols.success} ${message}`);
  }

  public failIcon = (message: string): void => {
    this.error(`${logSymbols.error} ${message}`);
  }

  public warnIcon = (message: string): void => {
    this.warn(`${logSymbols.warning} ${message}`);
  }

  public infoIcon = (message: string): void => {
    this.info(`${logSymbols.info} ${message}`);
  }

  public spinner = (message: string): ISpinner => {
    if (this.oraInstance) {
      this.oraInstance.stop();
    }
    this.oraInstance = ora(message).start();
    this.spinnerActive = true;
    this.oraInstance.start();

    const finish = (method: string, color?: (msg: string) => string) => (text?: string) => {
      if (!this.oraInstance) { return; }
      if (color && text) {
        this.oraInstance[method](color(text));
      } else {
        this.oraInstance[method](text);
      }
      this.spinnerActive = false;
      this.oraInstance = null;
    };
    return {
      start: () => this.oraInstance && this.oraInstance.start(),
      stop: () => this.oraInstance && this.oraInstance.stop(),
      succeed: finish('succeed'),
      fail: finish('fail', chalk.red),
      warn: finish('warn', chalk.yellow),
      info: finish('info'),
      clear: () => this.oraInstance && this.oraInstance.clear(),
      render: () => this.oraInstance && this.oraInstance.render(),
    };
  }

  private log = (level: string, message: string) => {
    let color = (msg: string) => msg;
    let output = process.stdout;

    switch (level) {
      case 'debug':
        color = chalk.dim;
        break;
      case 'warn':
        color = chalk.yellow;
        break;
      case 'error':
        color = chalk.red;
        output = process.stderr;
        break;
      case 'fatal':
        color = chalk.bold.red;
        output = process.stderr;
        break;
    }

    if (this.spinnerActive) {
      // We need to temporarily clear the spinner as we write this output
      this.oraInstance.stop();
    }

    output.write(color(format(message) + '\n'));

    if (this.spinnerActive) {
      // Resume the spinner!
      this.oraInstance.start();
    }
  }
}
