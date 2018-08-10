/* eslint-env jest */
const jscodeshift = require('jscodeshift');
const codemod = require('./use-underscore-import');
const testUtil = require('./test-util');
const { testChanged, testUnchanged } = testUtil(jscodeshift, codemod);
describe('use-underscore-import', () => {
  testChanged(
    "import { get } from 'lodash'; get('a');",
    "import _ from 'lodash'; _.get('a')"
  );
  testChanged(
    "import get from 'lodash/get'; get('a');",
    "import _ from 'lodash'; _.get('a')"
  );
  testChanged(
    "import get from 'lodash/get'; get('a');",
    "import _ from 'lodash'; _.get('a')"
  );
  testChanged(
    "import get from 'lodash/get'; import _ from 'lodash'; get('a'); _.get('a')",
    "import _ from 'lodash'; _.get('a'); _.get('a');"
  );
  testChanged(
    "import { map, identity } from 'lodash'; map([], identity);",
    "import _ from 'lodash'; _.map([], _.identity);",
  );
  testUnchanged("import _ from 'lodash'; _.get('a')");
 });