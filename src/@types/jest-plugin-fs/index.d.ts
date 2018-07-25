/* tslint:disable */

// This is definitely incomplete, I'm just filling in functions as I go to
// satisfy the typechecker
declare module 'jest-plugin-fs' {
  interface IFiles {
    [name: string]: string;
  }
  export let mock: (files?: IFiles) => void;
  export const restore: () => void;
  export const read: (file: string) => string;
  export const files: () => {
    [path: string]: string
  };

  export const readFileSync: (file: string) => string;
}
