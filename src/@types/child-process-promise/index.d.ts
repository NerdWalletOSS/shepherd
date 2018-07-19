declare module 'child-process-promise' {
  import { ChildProcess, SpawnOptions, ExecOptions } from "child_process";

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
    name: string;
    code: number;
    childProcess: ChildProcess;
    stdout?: string;
    stderr?: string;
  }

  export function exec(command: string, options: ExecOptions): ChildProcessPromise;
  export function spawn(command: string, args: string[], options: SpawnOptions): ChildProcessPromise;
}
