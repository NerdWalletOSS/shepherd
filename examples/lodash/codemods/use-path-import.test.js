/* eslint-env jest */
const jscodeshift = require('jscodeshift');
const codemod = require('./use-path-import');
const testUtil = require('./test-util');
const { testChanged } = testUtil(jscodeshift, codemod);
describe('use-path-import', () => {
  testChanged(
    "import _ from 'lodash'; _.get('a');",
    "import { get } from 'lodash'; get('a')"
  );
  testChanged(
    "import _ from 'lodash'; _.get('a'); _.isPlainObject('a');",
    "import { get, isPlainObject } from 'lodash'; get('a'); isPlainObject('a');"
  );
});