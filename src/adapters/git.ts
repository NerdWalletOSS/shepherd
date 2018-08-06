/* eslint-disable class-methods-use-this */
import fs from 'fs-extra-promise';
import simpleGit, { SimpleGit } from 'simple-git/promise';

import { IMigrationContext } from '../migration-context';
import IRepoAdapter, { IRepo } from './base';

abstract class GitAdapter implements IRepoAdapter {
  protected migrationContext: IMigrationContext;
  protected branchName: string;
  constructor(migrationContext: IMigrationContext) {
    this.migrationContext = migrationContext;
    this.branchName = migrationContext.migration.spec.id;
  }

  public abstract getCandidateRepos(): Promise<IRepo[]>;

  public abstract parseRepo(repo: string): IRepo;

  public abstract reposEqual(repo1: IRepo, repo2: IRepo): boolean;

  public abstract stringifyRepo(repo: IRepo): string;

  public abstract getRepoDir(repo: IRepo): string;

  public abstract getDataDir(repo: IRepo): string;

  public async checkoutRepo(repo: IRepo): Promise<void> {
    const repoPath = this.getRepositoryUrl(repo);
    const localPath = this.getRepoDir(repo);

    if (await fs.existsAsync(localPath) && await this.git(repo).checkIsRepo()) {
      // Repo already exists; just fetch
      await this.git(repo).fetch('origin');
    } else {
      await simpleGit().clone(repoPath, localPath);
    }

    // We'll immediately create and switch to a new branch
    try {
      await this.git(repo).checkout(
        ['-b', this.branchName, `origin/${this.branchName}`],
      );
    } catch (e) {
      try {
        await this.git(repo).checkoutLocalBranch(this.branchName);
      } catch (e) {
        // This branch probably already exists; we'll just switch to it
        // to make sure we're on the right branch for the commit phase
        await this.git(repo).checkout(this.branchName);
      }
    }
  }

  public async updateRepo(repo: IRepo): Promise<void> {
    await this.git(repo).pull('origin', this.branchName);
  }

  public async canResetBranch(repo: IRepo): Promise<boolean> {
    // We'll check if the last commit starts either with `[shepherd]` or
    // `Shepherd: ` (legacy). If it does, we're good to go. Otherwise,
    // abort.
    const commitLog = await this.git(repo).log();
    return this.isShepherdCommitMessage(commitLog.latest.message);
  }

  public async resetBranch(repo: IRepo): Promise<void> {
    // Potentially bad assumption: either the most recent commit is not from
    // Shepherd, or it is, and all previous commits are also from Shepherd.
    // If the most recent commit is from Shepherd, we'll walk back to the first
    // non-Shepherd commit in our history and reset to that as a base on which
    // apply the migration again.
    const commitLog = await this.git(repo).log();
    if (!this.isShepherdCommitMessage(commitLog.latest.message)) {
      // We shouldn't ever end up in this state, but if we do, die loudly
      throw new Error('Cannot reset branch: most recent commit is not from Shepherd');
    }

    // Find the first non-Shepherd commit
    const commit = commitLog.all.find((c) => !this.isShepherdCommitMessage(c.message));

    if (!commit) {
      throw new Error('Could not find a commit that is not from Shepherd');
    }

    // Reset to this commit
    await this.git(repo).reset(['--hard', commit.hash]);
  }

  public async commitRepo(repo: IRepo): Promise<void> {
    const { migration: { spec } } = this.migrationContext;
    await this.git(repo).add('.');
    await this.git(repo).commit(`Shepherd: ${spec.title}`);
  }

  public async resetRepo(repo: IRepo): Promise<void> {
    await this.git(repo).reset('hard');
    await this.git(repo).clean('f', ['-d']);
  }

  public async pushRepo(repo: IRepo): Promise<void> {
    await this.git(repo).push('origin', 'HEAD', { '-f': null });
  }

  public abstract createPullRequest(repo: IRepo, message: string): Promise<void>;

  public abstract getPullRequestStatus(repo: IRepo): Promise<string[]>;

  protected abstract getRepositoryUrl(repo: IRepo): string;

  protected git(repo: IRepo): SimpleGit {
    const git = simpleGit(this.getRepoDir(repo));
    git.silent(true);
    return git;
  }

  protected isShepherdCommitMessage(message: string): boolean {
    return message.indexOf('Shepherd: ') === 0 || message.indexOf('[shepherd]') === 0;
  }
}
export default GitAdapter;
