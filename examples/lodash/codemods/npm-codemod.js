const b = require('ast-types').builders;
const lodash = require('lodash');
const lodash3 = require('lodash3');

module.exports = (fileInfo, api) => {
  const { j } = api;
  const ast = j(fileInfo.source);

  const imports = ast.find(j.ImportDeclaration);
  const lodashImports = imports.filter(path => {
    const { node } = path;
    return node.source.value.indexOf('lodash.') === 0;
  });

  if (lodashImports.length === 0) {
    // No lodash imports in this file
    return undefined;
  }

  const lodashMethods = Object.keys(lodash);
  const lodash3Methods = Object.keys(lodash3);

  // Individual methods were published as packages with the method names
  // converted from camelCase to lowercase. To resolve a given import to
  // its actual method name, we'll do a case insensitive compare against all
  // keys in lodash. We'll start searching in lodash@4 and fallback to
  // lodash@3 if the first lookup fails.
  const findMethod = lowercaseMethod => {
    const isMatch = method => method.toLowerCase(method) === lowercaseMethod;
    return lodashMethods.find(isMatch) || lodash3Methods.find(isMatch);
  };

  // Let's generate some new imports!
  const newImports = [];
  lodashImports.forEach(path => {
    const { node } = path;

    const lowercaseMethod = node.source.value.split('.')[1];
    const method = findMethod(lowercaseMethod);
    const importSpecifiers = [
      b.importDefaultSpecifier(b.identifier(node.specifiers[0].local.name)),
    ];
    const importPath = `lodash/${method}`;
    newImports.push(
      b.importDeclaration(importSpecifiers, b.literal(importPath))
    );
  });

  // If any comments exist prior to the first import, let's try to keep them
  // We only want the leading comments, but only "comments" is used during
  // serialization of the AST
  const originalComments = lodashImports.get('leadingComments');
  if (originalComments) {
    newImports[0].comments = originalComments.value;
  }

  // Insert new import statement into AST
  lodashImports.at(-1).insertAfter(newImports);

  // Remove any old imports
  lodashImports.forEach(path => path.replace());

  return ast.toSource({ quote: 'single' });
};
