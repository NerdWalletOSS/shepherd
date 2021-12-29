/* tslint:disable */

declare module 'child-process-promise' {
  import { ChildProcess, ExecOptions, SpawnOptions } from 'child_process';

  export interface ChildProcessResult {
    childProcess: ChildProcess;
    stdout?: string;
    stderr?: string;
    code: number;
  }

  export class ChildProcessPromise extends Promise<ChildProcessResult> {
    childProcess: ChildProcess;
  }

  export class ChildProcessError extends Error {
    public name: string;
    public code: number;
    public childProcess: ChildProcess;
    public stdout?: string;
    public stderr?: string;
  }

  export function exec(command: string, options: ExecOptions): ChildProcessPromise;
  export function spawn(
    command: string,
    args: string[],
    options: SpawnOptions
  ): ChildProcessPromise;
}
