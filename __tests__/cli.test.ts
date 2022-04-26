import { createBinTester } from '@scalvert/bin-tester';
import { createMigration, MigrationProject } from './__utils__/migration-project';

const { setupProject, teardownProject, runBin } = createBinTester({
  binPath: require.resolve('../lib/cli.js'),
  createProject: async () => createMigration('shepherd-migration'),
});

describe('cli', () => {
  let project: MigrationProject;

  beforeEach(async function () {
    project = await setupProject();

    await project.write();
  });

  afterEach(function () {
    teardownProject();
  });

  describe('--help', () => {
    it('can show help for shepherd', async () => {
      const result = await runBin('--help');

      expect(result.exitCode).toEqual(0);
      expect(result.stdout).toMatchInlineSnapshot(`
"Usage: shepherd [options] [command]

Options:
  -h, --help                        display help for command

Commands:
  checkout [options] <migration>    Check out any repositories that are
                                    candidates for a given migration
  apply [options] <migration>       Apply a migration to all checked out
                                    repositories
  commit [options] <migration>      Commit all changes for the specified
                                    migration
  reset [options] <migration>       Reset all changes for the specified
                                    migration
  push [options] <migration>        Push all changes for the specified
                                    migration
  pr-preview [options] <migration>  View a preview of the PR messages for the
                                    specified migration
  pr [options] <migration>          Create PRs for the specified migration
  pr-status [options] <migration>   Check the status of all PRs for the
                                    specified migration
  list <migration>                  List all checked out repositories for the
                                    given migration
  version                           Print Shepherd version
  help [command]                    display help for command"
`);
    });

    it('can show help for checkout command', async () => {
      const result = await runBin('checkout', '--help');

      expect(result.exitCode).toEqual(0);
      expect(result.stdout).toMatchInlineSnapshot(`
"Usage: shepherd checkout [options] <migration>

Check out any repositories that are candidates for a given migration

Options:
  --repos <repos>  Comma-separated list of repos to operate on
  -h, --help       display help for command"
`);
    });

    it('can show help for apply command', async () => {
      const result = await runBin('apply', '--help');

      expect(result.exitCode).toEqual(0);
      expect(result.stdout).toMatchInlineSnapshot(`
"Usage: shepherd apply [options] <migration>

Apply a migration to all checked out repositories

Options:
  --repos <repos>        Comma-separated list of repos to operate on
  --skip-reset-branch    Don't reset branch before applying (default: false)
  --force-reset-branch   Force a reset of the branch before applying (default:
                         true)
  --skip-reset-on-error  Keep changes in the working tree even if the migration
                         fails (default: false)
  -h, --help             display help for command"
`);
    });

    it('can show help for commit command', async () => {
      const result = await runBin('commit', '--help');

      expect(result.exitCode).toEqual(0);
      expect(result.stdout).toMatchInlineSnapshot(`
"Usage: shepherd commit [options] <migration>

Commit all changes for the specified migration

Options:
  --repos <repos>  Comma-separated list of repos to operate on
  -h, --help       display help for command"
`);
    });

    it('can show help for reset command', async () => {
      const result = await runBin('reset', '--help');

      expect(result.exitCode).toEqual(0);
      expect(result.stdout).toMatchInlineSnapshot(`
"Usage: shepherd reset [options] <migration>

Reset all changes for the specified migration

Options:
  --repos <repos>  Comma-separated list of repos to operate on
  -h, --help       display help for command"
`);
    });

    it('can show help for push command', async () => {
      const result = await runBin('push', '--help');

      expect(result.exitCode).toEqual(0);
      expect(result.stdout).toMatchInlineSnapshot(`
"Usage: shepherd push [options] <migration>

Push all changes for the specified migration

Options:
  --repos <repos>  Comma-separated list of repos to operate on
  -f, --force      Force push, skipping any safety checks
  -h, --help       display help for command"
`);
    });

    it('can show help for pr-preview command', async () => {
      const result = await runBin('pr-preview', '--help');

      expect(result.exitCode).toEqual(0);
      expect(result.stdout).toMatchInlineSnapshot(`
"Usage: shepherd pr-preview [options] <migration>

View a preview of the PR messages for the specified migration

Options:
  --repos <repos>  Comma-separated list of repos to operate on
  -h, --help       display help for command"
`);
    });

    it('can show help for pr command', async () => {
      const result = await runBin('pr', '--help');

      expect(result.exitCode).toEqual(0);
      expect(result.stdout).toMatchInlineSnapshot(`
"Usage: shepherd pr [options] <migration>

Create PRs for the specified migration

Options:
  --repos <repos>  Comma-separated list of repos to operate on
  -h, --help       display help for command"
`);
    });

    it('can show help for pr-status command', async () => {
      const result = await runBin('pr-status', '--help');

      expect(result.exitCode).toEqual(0);
      expect(result.stdout).toMatchInlineSnapshot(`
"Usage: shepherd pr-status [options] <migration>

Check the status of all PRs for the specified migration

Options:
  --repos <repos>  Comma-separated list of repos to operate on
  -h, --help       display help for command"
`);
    });
  });
});
