/* tslint:disable */

declare module 'jest-plugin-fs' {
  interface IFiles {
    [name: string]: string;
  }
  export let mock: (files?: IFiles) => void;
  export const restore: () => void;
  export const read: (file: string) => string;
}
