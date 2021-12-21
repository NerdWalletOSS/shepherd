import execa from 'execa';
import { Project } from 'fixturify-project';

const ROOT = process.cwd();

describe('cli', () => {
  let project: Project;

  beforeEach(function () {
    project = new Project('shepherd-migration', '0.0.0', () => {});

    project.writeSync();
  });

  afterEach(function () {
    process.chdir(ROOT);
    project.dispose();
  });

  it('can show help', async () => {
    let result = await shepherd();

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

  function shepherd(
    argsOrOptions?: string[] | execa.Options,
    options?: execa.Options
  ) {
    if (arguments.length > 0) {
      if (arguments.length === 1) {
        if (Array.isArray(argsOrOptions)) {
          options = {};
        } else {
          options = argsOrOptions as execa.Options;
          argsOrOptions = [];
        }
      }
    } else {
      argsOrOptions = [];
      options = {};
    }

    const mergedOptions = Object.assign(
      {
        reject: false,
        cwd: project.baseDir,
      },
      options
    );

    return execa(
      process.execPath,
      [require.resolve('../lib/cli.js'), ...(argsOrOptions as string[])],
      mergedOptions
    );
  }
});
