/* eslint-env jest */
const jscodeshift = require('jscodeshift');
const codemod = require('./npm-codemod');
const testUtil = require('./test-util');
const { testChanged, testUnchanged } = testUtil(jscodeshift, codemod);
describe('npm-codemod', () => {
  testChanged("import get from 'lodash.get';", "import get from 'lodash/get';");
  testChanged(
    "import isPlainObject from 'lodash.isplainobject';",
    "import isPlainObject from 'lodash/isPlainObject';"
  );
  testChanged("import wat from 'lodash.get';", "import wat from 'lodash/get';");
  testUnchanged("import get from 'lodash/get';");
  testUnchanged("import { get } from 'lodash';");
});
