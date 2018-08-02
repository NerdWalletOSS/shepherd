cat <<-\EOF
Hey there! :wave:

ESLint deprecated extension-less `.eslintrc` config files in favor of
explicitly stating the file extension. This PR renames any `.eslintrc`
with valid JSON or YAML to `.eslintrc.json` and pretty-prints the contents
as JSON. While ESLint is not removing support for `.eslintrc` files, this
helps keep our codebases consistent and also helps us test automating PRs using
[Shepherd](https://github.com/nerdwallet/shepherd/).

This is a low risk change since
[ESLint automatically reads `.eslintrc.json` files](https://eslint.org/docs/user-guide/configuring#configuration-file-formats)
in a similar way to `.eslintrc` files. We recommend merging this PR as long
as your build passes.
EOF
