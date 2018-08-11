cat <<-\EOF
Hey!

This PR updates you to the latest version of Lodash with
[lodash-codemods](https://github.com/jfmengels/lodash-codemods).

This PR also standardizes your import style. This was necessary because `lodash-codemods`
assumes that Lodash is always used via a member access on the `_` object.

```diff
- import { get} from 'lodash';
- import get from 'lodash/get';
- import get from 'lodash.get';
- get(...);
+ import _ from 'lodash';
+ _.get(...);
```

This should not negatively affect bundle size if you use `babel-plugin-lodash`.
However, you should still check that your bundle size does not unreasonably
increase after this PR.
EOF
