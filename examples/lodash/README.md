## Lodash Migration

This migration moves code from Lodash 3 to Lodash 4. In the process, it also standardizes how Lodash is declared as a dependency and how it is imported.

There are existing codemods from the community ([`lodash-codemod`](https://github.com/jfmengels/lodash-codemods)) that can perform the bulk of the v3 -> v4 migration. However, it only applies to usages that look like:

```js
import _ from 'lodash';
_.get(...);
```

However, many usages look more like one of these:

```js
import { get } from 'lodash';
import get from 'lodash/get';
import get from 'lodash.get';

get(...);
```

So, in order to properly run this migration, we need to do several stages of transforms.

### Step 1

We first need to transform any `lodash.xxx` imports into `lodash/xxx` imports.

Before:
```js
import get from 'lodash.get';
import isPlainObject from 'lodash.isplainobject';
```

After:
```js
import get from 'lodash/get';
import isPlainObject from 'lodash/isPlainObject';
```

This is implmemented in `codemods/npm-codemod.js`.

### Step 2

We need to transform the various ways of importing and accessing Lodash methods so that we can run the v3 -> v4 codemods.

Before:
```js
import { get } from 'lodash';
import get from 'lodash/get';

get(...);
```

After:
```js
import _ from 'lodash';

_.get(...);
```

### Step 3

We can now run the v3 -> v4 codemods; these are provided by the community.

### Step 4

We now need to go the other direction from the second step.

Before:
```js
import _ from 'lodash';

_.get(...);
```

After:
```js
import { get } from 'lodash';

get(...);
```

### Step 5

Finally, we can uninstall any `lodash.xxx` packages.