declare module 'jest-plugin-fs' {
  interface Files {
    [name: string]: string
  }
  export let mock: (files?: Files) => void
  export const restore: () => void
  export const read: (file: string) => string
}