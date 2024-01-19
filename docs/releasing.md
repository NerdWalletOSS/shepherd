# Releasing Shepherd

Shepherd uses [semantic-release](https://github.com/semantic-release/semantic-release), GitHub workflows, and [GitHub Actions](https://docs.github.com/en/actions) to fully automate releases.

Every merge to main triggers a GitHub workflow which culminates in a new tag. Every new tag triggers a GitHub Action job which culminates in the new tagged version of Shepherd being published to npm.

## semantic-release

- CHANGELOG updates made via [@semantic-release/changelog](https://github.com/semantic-release/changelog)
- Release Notes compiled via [@semantic-release/release-notes-generator](https://github.com/semantic-release/release-notes-generator)
- Tagging based on commit message via [@semantic-release/commit-analyzer](https://github.com/semantic-release/commit-analyzer)
  - Commits that contain `BREAKING CHANGE`, `BREAKING CHANGES`, or `BREAKING` in their body will be considered breaking changes.
  - Commits with a `docs`, `style`, `refactor`, or `perf` type will be associated with a patch release.
  - If a commit doesn't match any of the above rules, it will be evaluated against the [default release rules](https://github.com/semantic-release/commit-analyzer/blob/master/lib/default-release-rules.js).

Note: `semantic-release` depends on `GH_TOKEN` only as part of CI/CD. Users need not set this token to use Shepherd.
