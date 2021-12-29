/* eslint-env jest */
const recast = require('recast');
module.exports = (jscodeshift, plugin) => {
  const mockApi = {
    jscodeshift,
    j: jscodeshift,
    stats: () => {},
  };
  function runPlugin(source) {
    const fileInfo = { path: 'file.js', source };
    return plugin(fileInfo, mockApi);
  }
  const formatCode = (input) => recast.prettyPrint(recast.parse(input)).code;
  const expectEqual = (actual, expected) => {
    // We'll round trip everything through an AST to ensure that we're
    // comparing AST structure and not formatting
    const formattedActual = formatCode(actual);
    const formattedExpected = formatCode(expected);
    expect(formattedActual).toEqual(formattedExpected);
  };
  const testChanged = (input, expected) => {
    test(input, () => {
      expectEqual(runPlugin(input), expected);
    });
  };
  const testUnchanged = (input) => {
    test(input, () => {
      const res = runPlugin(input);
      if (res === undefined) {
        // We're good; returning undefined signals an unchanged file to jscodeshift
      } else {
        expectEqual(res, input);
      }
    });
  };
  return { testChanged, testUnchanged };
};
