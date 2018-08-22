# Releasing Shepherd

Shepherd uses [Travis CI](https://travis-ci.org/) for continuous integration, and it's also set up to automatically publish new tags when they're pushed to GitHub.

1. Move any changes under the "Upcoming" heading in `CHANGELOG.md` to a new header based on the upcoming version name.
1. Use `npm version [patch|minor|major]` to create a new version. This command will update the version in `package.json`, commit the changes, and tag it with the corresponding `vX.Y.Z` name.
1. Run `git push origin vX.Y.Z` to push the new tag to GitHub. This will kick off a new job on Travis, and the new version will be published automatically if all tests pass.
1. Create a new release on GitHub based on the new tag. Include the corresponding entries from the changelog in the release description.
