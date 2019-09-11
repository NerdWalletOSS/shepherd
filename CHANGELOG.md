# Changelog

When new features, bug fixes, and so on are added to Shepherd, there should be a corresponding entry made in the changelog under the *[Upcoming]* header.

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
