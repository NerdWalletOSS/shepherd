declare module 'child-process-promise' {
  import { ChildProcess, SpawnOptions, ExecOptions } from "child_process";

  export class ChildProcessPromise extends Promise<ChildProcess> {
    childProcess: ChildProcess;
  }

  export class ChildProcessError extends Error {
    name: string;
    code: number;
    childProcess: ChildProcess;
    stdout?: string;
    stderr?: string;
  }

  export function exec(command: string, options: ExecOptions): Promise<ChildProcess>;
  export function spawn(command: string, args: string[], options: SpawnOptions): Promise<ChildProcess>;
}
