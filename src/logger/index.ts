import chalk from 'chalk';

export interface ILoggerApi {
  debug(message: string): void;
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
  fatal(message: string): void;
}

export default class Logger implements ILoggerApi {
  public debug(message: string): void {
    process.stdout.write(chalk.dim.white(message + '\n'));
  }
  public info(message: string): void {
    process.stdout.write(chalk.white(message + '\n'));
  }
  public warn(message: string): void {
    process.stdout.write(chalk.yellow(message + '\n'));
  }
  public error(message: string): void {
    process.stderr.write(chalk.red(message + '\n'));
  }
  public fatal(message: string): void {
    process.stderr.write(chalk.bold.red(message + '\n'));
  }

}
