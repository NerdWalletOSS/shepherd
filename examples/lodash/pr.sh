cat <<-\EOF
Hey!

This PR updates you to the latest version of Lodash. If you were on
Lodash 3, your code has been updated with
[lodash-codemods](https://github.com/jfmengels/lodash-codemods).

Even if you were already on the latest version of Lodash, we've also
standardized your import style. This was necessary because `lodash-codemods`
assumes a certain style of import, so we first had to transform your code
to use that import style, and we needed to then transform all imports back
to something. We now use destructuring on the lodash import.

```diff
- import get from 'lodash/get';
- import set from 'lodash.set';
+ import { get, set } from 'lodash';
```

This should not negatively affect bundle size if you use `babel-plugin-lodash`.
However, you should still check that your bundle size does not unreasonably
increase after this PR.
EOF
