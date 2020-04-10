# [1.6.0](https://github.com/NerdWalletOSS/shepherd/compare/v1.5.0...v1.6.0) (2020-04-10)


### Features

* add dependabot config file. ([#121](https://github.com/NerdWalletOSS/shepherd/issues/121)) ([c201490](https://github.com/NerdWalletOSS/shepherd/commit/c201490ca293967517bd8f7d99eccb8c3bd11027))

# [1.5.0](https://github.com/NerdWalletOSS/shepherd/compare/v1.4.2...v1.5.0) (2020-04-09)


### Bug Fixes

* missing packages. ([#115](https://github.com/NerdWalletOSS/shepherd/issues/115)) ([7ace184](https://github.com/NerdWalletOSS/shepherd/commit/7ace184dfa116ebcb9dce2d99b50a60bbd659f30))


### Features

* add semantic release. ([#114](https://github.com/NerdWalletOSS/shepherd/issues/114)) ([4d41c4f](https://github.com/NerdWalletOSS/shepherd/commit/4d41c4f6625125a258fca2e1aa3bfa4c9df543f4))

# Changelog

When new features, bug fixes, and so on are added to Shepherd, there should be a corresponding entry made in the changelog under the *[Upcoming]* header.

## [Upcoming]
*

## v1.4.2
* Updated dependencies
* Dropped support for Node 6

## v1.4.1
* Updated dependencies

## v1.4.0

* Add adapter specific environment variables for all steps run after `checkout`.
* Add `SHEPHERD_BASE_BRANCH` environment variable for all steps run after `checkout`.
* Add magenta highlighting to merged PRs

## v1.3.0

* Throw a clearer error when there are no Github credentials found
* Fix an import of a dependency that uses `../../node_modules`

## v1.2.0

* GitHub adapter: add ability to checkout all of an organizations repos

## v1.1.0

* Use shallow git clones
* Always log stderr of hooks

## v1.0.2

* Fix for issue hitting GitHub rate limiting when operating on very large result sets by abiding by
the retry-after response header on failure

## v1.0.1

* Fix commit check logic when checking for non-Shepherd commits

## v1.0.0

* Initial public release to npm :tada:
