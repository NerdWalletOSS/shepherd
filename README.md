# Shepherd

<img alt="Illustration of a sheep" width=320 align=right src="https://user-images.githubusercontent.com/332258/46430732-c7bf5c80-c6fe-11e8-9cc8-2abc4e68dce2.jpg">

![Travis status](https://img.shields.io/travis/NerdWalletOSS/shepherd/master.svg?style=flat-square)
![npm version](https://img.shields.io/npm/v/@nerdwallet/shepherd.svg?style=flat-square)
![GitHub issues](https://img.shields.io/github/issues/NerdWalletOSS/shepherd.svg?style=flat-square)

Shepherd is a utility for applying code changes across many repositories.

* **Powerful**: You can write migration scripts using your favorite Unix commands, tools like [`jscodeshift`](https://github.com/facebook/jscodeshift), or scripts in your preferred programming language.
* **Easy**: With just a few commands, you can checkout dozens of repositories, apply changes, commit those changes, and open pull requests with detailed messages.
* **Flexible**: Ships with support for Git/GitHub, but can easily be extended to work with other version control products like Bitbucket, GitLab, or SVN.

For more high level context, this [blog post](https://www.nerdwallet.com/blog/engineering/shepherd-automating-code-changes/) covers the basics.

## Getting started

Install the Shepherd CLI:

```sh
npm install -g @nerdwallet/shepherd
```

Shepherd will now be available as the `shepherd` command in your shell:

```sh
shepherd --help
```

```text
Usage: shepherd [options] [command]
...
```

Take a look at the [tutorial](docs/tutorial.md) for a detailed walkthrough of what Shepherd does and how it works, or read on for a higher-level and more brief look!

[Go to tutorial →](docs/tutorial.md)

## Motivation for using Shepherd

Moving away from monorepos and monolithic applications has generally been a good thing for developers because it allows them to move quickly and independently from each other. However, it's easy to run into problems, especially if your code relies on shared libraries. Specifically, making a change to shared code and then trying to roll that shared code out to all consumers of that code becomes difficult:

* The person updating that library must communicate the change to consumers of the library
* The consumer must understand the change and how they have to update their own code
* The consumer must make the necessary changes in their own code
* The consumer must test, merge, and deploy those changes

Shepherd aims to help shift responsibility for the first three steps to the person actually making the change to the library. Since they have the best understanding of their change, they can write a code migration to automate that change and then user Shepherd to automate the process of applying that change to all relevant repos. Then the owners of the affected repos (who have the best understanding of their own code) can review and merge the changes. This process is especially efficient for teams who rely on continuous integration: automated tests can help repository owners have confidence that the code changes are working as expected.

## Writing migrations

A migration is declaratively specified with a `shepherd.yml` file called a spec. Here's an example of a migration spec that renames `.eslintrc` to `.eslintrc.json` in all NerdWallet repositories that have been modified in 2018:

```yml
id: 2018.07.16-eslintrc-json
title: Rename all .eslintrc files to .eslintrc.json
adapter:
  type: github
  search_query: org:NerdWallet path:/ filename:.eslintrc
hooks:
  should_migrate:
    - ls .eslintrc # Check that this file actually exists in the repo
    - git log -1 --format=%cd | grep 2018 --silent # Only migrate things that have seen commits in 2018
  post_checkout: npm install
  apply: mv .eslintrc .eslintrc.json
  pr_message: echo "Hey! This PR renames `.eslintrc` to `.eslintrc.json`"
```

Let's go through this line-by-line:

* `id` specifies a unique identifier for this migration. It will be used as a branch name for this migration, and will be used internally by Shepherd to track state about the migration.
* `title` specifies a human-readable title for the migration that will be used as the commit message.
* `adapter` specifies what version control adapter should be used for performing operations on repos, as well as extra options for that adapter. Currently Shepherd only has a GitHub adapter, but you could create a Bitbucket or GitLab adapter if you don't use GitHub. Note that `search_query` is specific to the GitHub adapter: it uses GitHub's [code search qualifiers](https://help.github.com/articles/searching-code/) to identify repositories that are candidates for a migration. If a repository contains a file matching the search, it will be considered a candidate for this migration.  As an alternative to `search_query`, GitHub adapter can be configured with `org: YOURGITHUBORGANIZATION`.  When using `org`, every repo in the organization that is visible will be considered as a candidate for this migration.

The options under `hooks` specify the meat of a migration. They tell Shepherd how to determine if a repo should be migrated, how to actually perform the migration, how to generate a pull request message for each repository, and more. Each hook consists of one or more standard executables that Shepherd will execute in sequence.

* `should_migrate` is a sequence of commands to execute to determine if a repo actually requires a migration. If any of them exit with a non-zero value, that signifies to Shepherd that the repo should not be migrated. For instance, the second step in the above `should_migrate` hook would fail if the repo was last modified in 2017, since `grep` would exit with a non-zero value.
* `post_checkout` is a sequence of commands to be executed once a repo has been checked out and passed any `should_migrate` checks. This is a convenient place to do anything that will only need to be done once per repo, such as installing any dependencies.
* `apply` is a sequence of commands that will actually execute the migration. This example is very simple: we're just using `mv` to rename a file. However, this hook could contain arbitrarily many, potentially complex commands, depending on the requirements of your particular migration.
* `pr_message` is a sequence of commands that will be used to generate a pull request message for a repository. In the simplest case, this can just be a static message, but you could also programmatically generate a message that calls out particular things that might need human attention. Anything written to `stdout` will be used for the message. If multiple commands are specified, the output from each one will be concatenated together.

`should_migrate` and `post_checkout` are optional; `apply` and `pr_message` are required.

Each of these commands will be executed with the working directory set to the target repository. Shepherd exposes some context to each command via specific environment variables. Some additional enviornment variables are exposed when using the `git` or `github` adapters.

* `SHEPHERD_REPO_DIR` is the absolute path to the repository being operated on. This will be the working directory when commands are executed.
* `SHEPHERD_DATA_DIR` is the absolute path to a special directory that can be used to persist state between steps. This would be useful if, for instance, a `jscodeshift` codemod in your `apply` hook generates a list of files that need human attention and you want to use that list in your `pr_message` hook.
* `SHEPHERD_BASE_BRANCH` is the name of the branch Shepherd will set up a pull-request against. This will often, _but not always_, be master. Only available for `apply` and later steps.
* `SHEPHERD_MIGRATION_DIR` is the absolute path to the directory containing your migration's `shepherd.yml` file. This is useful if you want to include a script with your migration spec and need to reference that command in a hook. For instance, if I have a script `pr.sh` that will generate a PR message: my `pr_message` hook might look something like this:

  ```yml
  pr_message: $SHEPHERD_MIGRATION_DIR/pr.sh
  ```
* `SHEPHERD_GIT_REVISION` (`git` and `github` adapters) is the current revision of the repository being operated on.
* `SHEPHERD_GITHUB_REPO_OWNER` (`github` adapter) is the owner of the repository being operated on. For example, if operating on the repository `https://github.com/NerdWalletOSS/shepherd`, this would be `NerdWalletOSS`.
* `SHEPHERD_GITHUB_REPO_NAME` (`github` adapter) is the name of the repository being operated on. For example, if operating on the repository `https://github.com/NerdWalletOSS/shepherd`, this would be `shepherd`.

Commands follow standard Unix conventions: an exit code of 0 indicates a command succeeded, a non-zero exit code indicates failure.

### Usage

Shepherd is run as follows:

```sh
shepherd <command> <migration> [options]
```

`<migration>` is the path to your migration directory containing a `shepherd.yml` file.

There are a number of commands that must be run to execute a migration:

* `checkout`: Determines which repositories are candidates for migration and clones or updates the repositories on your machine. Clones are "shallow", containing no git history. Uses `should_migrate` to decide if a repository should be kept after it's checked out.
* `apply`: Performs the migration using the `apply` hook discussed above.
* `commit`: Makes a commit with any changes that were made during the `apply` step, including adding newly-created files. The migration's `title` will be prepended with `[shepherd]` and used as the commit message.
* `push`: Pushes all commits to their respective repositories.
* `pr-preview`: Prints the commit message that would be used for each repository without actually creating a PR; uses the `pr_message` hook.
* `pr`: Creates a PR for each repo with the message generated from the `pr_message` hook.
* `version`: Prints Shepherd version

By default, `checkout` will use the adapter to figure out which repositories to check out, and the remaining commands will operate on all checked-out repos. To only checkout a specific repo or to operate on only a subset of the checked-out repos, you can use the `--repos` flag, which specifies a comma-separated list of repos:

```sh
shepherd checkout path/to/migration --repos facebook/react,google/protobuf
```

Run `shepherd --help` to see all available commands and descriptions for each one.

### Developing

Run `npm install` to install dependencies, and then `npm install -g` to make the `shepherd` executable available on your `PATH`.

Shepherd is written in TypeScript, which requires compilation to JavaScript. When developing Shepherd, it's recommended to run `npm run build:watch` in a separate terminal. This will incrementally compile the source code as you edit it.

Shepherd currently has minimal test coverage, but we're aiming to improve that with each new PR. Tests are written with Jest and should be named in a `*.test.ts` alongside the file under test. To run the test suite, run `npm run test`.

We use [TSLint](https://github.com/palantir/tslint) to ensure a consistent coding style and to help prevent certain classes of problems. Run `npm run lint` to run the linter, and `npm run fix-lint` to automatically fix applicable problems.