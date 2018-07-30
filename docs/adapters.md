# Adapters

Shepherd is designed to be agnostic to the type of repositories it operates on. This allows it to be used with any version control system (git, svn, mercurial, etc.) or any hosted VCS (GitHub, Bitbucket, etc.). Shepherd supports these variety of systems by hiding all repository operations behind an *adapter*.

An adapter exposes a consistent interface for common repository operations, which are then used by Shepherd as you execute commands to perform a migration. The interface for an adapter is specified in `src/adapters/base.ts`.

## Repositories

Shepherd intentionally leaves it up to each adapter to specify what a "repository" actually consists of. For instance, a GitHub repository might be specified by an owner and a repository name, whereas a Subversion repository could be represented by a URL.

Here's the TypeScript interface for an object describing a repository:

```ts
interface IRepo {
  [key: string]: any;
}
```

This translates to "an object with arbitrary string keys and arbitrary values". This doesn't offer much in the way of type-checking, but it does allow us to make clear when a function requires a repo object as opposed to some other arbitrary object.

Even though a Shepherd object doesn't have a well-defined schema, Shepherd still needs to be able to derive information from repo objects, such as where a repository is checked out or how to format a repository object for printing. To accomplish this, adapters are required to have functions that allows Shepherd to query them for information about a specific repository.

- `parseSelectedRepo(repo: string): IRepo`: When repositories are specified via the `--repos` option in the CLI, Shepherd needs to be able to turn those strings into an adapter's concept of a repository. This function accepts a string from the `--repos` object and turns it into a repo object. For example, the GitHub adapter would take the string `NerdWallet/shepherd` and return the object `{ owner: 'NerdWallet', name: 'shepherd' }`

- `reposEqual(repo1: IRepo, repo2: IRepo): boolean`: This function takes two repository objects and indicates if they represent the same repository.

- `formatRepo(repo: IRepo): string;`: This function takes a repository object and should return a human-readable representation of it for use when printing status messages. For example, the GitHub adapter would take the object `{ owner: 'NerdWallet', name: 'shepherd' }` and return `NerdWallet/shepherd`. This should essentially be the inverse of the `parseSelectedRepo` function.

- `getRepoDir(repo: IRepo): string;`: This function takes a repository and returns the absolute path to the directory where this repo is checked out to.

- `getDataDir(repo: IRepo): string;`: This function takes a repository and returns the absolute path to a directory where migration commands can write arbitrary files to in order to persist it between migration steps.

Looking at the implementation of all these functions in `src/adapters/github.ts` is a great way to see what the semantics of these functions should be.