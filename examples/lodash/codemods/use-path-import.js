const b = require('ast-types').builders;

module.exports = (fileInfo, api) => {
  const { j } = api;
  const ast = j(fileInfo.source);

  const lodashImports = ast.find(j.ImportDeclaration, {
    source: {
      value: 'lodash',
    },
  });

  if (lodashImports.length === 0) {
    // No lodash imports in this file
    return undefined;
  }

  const lodashIdentifier = lodashImports.nodes()[0].specifiers[0].local.name;

  // We'll remember a list of all methods used so we can construct imports
  const methods = [];

  // Find any method call like _.get(...) and replace it with get(...)
  ast
    .find(j.CallExpression, {
      callee: {
        type: 'MemberExpression',
        object: {
          name: lodashIdentifier,
        },
      },
    })
    .forEach(path => {
      const { node } = path;
      const memberName = node.callee.property.name;
      if (methods.indexOf(memberName) === -1) methods.push(memberName);
      path.replace(b.callExpression(b.identifier(memberName), node.arguments));
    });

  // Some may also be accessing members of the lodash object and passing them around,
  // such as `arr.map(_.identity). Handle that too.
  ast
    .find(j.MemberExpression, {
      object: {
        type: 'Identifier',
        name: '_',
      },
    })
    .forEach(path => {
      const { node } = path;
      const memberName = node.property.name;
      if (methods.indexOf(memberName) === -1) methods.push(memberName);
      path.replace(b.identifier(memberName));
    })

  // We can now generate some fancy new imports
  const newImportSpecifiers = methods
    .sort()
    .map(method =>
      b.importSpecifier(b.identifier(method), b.identifier(method))
    );

  const newImport = b.importDeclaration(
    newImportSpecifiers,
    b.literal('lodash')
  );

  // If any comments exist prior to the first import, let's try to keep them
  // We only want the leading comments, but only "comments" is used during
  // serialization of the AST
  const originalComments = lodashImports.get('leadingComments');
  if (originalComments) {
    newImport.comments = originalComments.value;
  }

  // Insert new import statement into AST
  lodashImports.at(-1).insertAfter(newImport);

  // Remove any old imports
  lodashImports.forEach(path => path.replace());

  return ast.toSource({ quote: 'single' });
};
