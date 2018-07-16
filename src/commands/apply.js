const ora = require('ora');

const execInRepo = require('../util/exec-in-repo');

module.exports = async (context) => {
  const {
    migration: { spec, repos },
    adapter,
  } = context;

  for (const repo of repos) {
    console.log(`\n[${adapter.formatRepo(repo)}]`);
    const spinner = ora('Running apply steps').start();
    let applySucceeded = true;
    for (const step of (spec.apply || [])) {
      try {
        await execInRepo(adapter, repo, step);
      } catch (e) {
        applySucceeded = false;
        spinner.clear();
        console.warn(e.stderr);
        spinner.fail(`apply step exited with exit code ${e.code}`);
        break;
      }
    }

    if (!applySucceeded) {
      // TODO handle this - reset repository?
    } else {
      spinner.succeed('should_migrate steps completed successfully');
    }
  }
};
