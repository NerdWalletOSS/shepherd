const b = require('ast-types').builders;

module.exports = (fileInfo, api) => {
  const { j } = api;
  const ast = j(fileInfo.source);

  const imports = ast.find(j.ImportDeclaration);
  const lodashImports = imports.filter(path => {
    const { node } = path;
    return (
      node.source.value === 'lodash' ||
      node.source.value.indexOf('lodash/') === 0
    );
  });

  if (lodashImports.length === 0) {
    // No lodash imports in this file
    return undefined;
  }

  // Let's now normalize the various imports to a standardized representation
  let lodashIdentifier = '_';
  const mappedLodashImports = [];
  lodashImports.forEach(path => {
    const { node } = path;
    const { source, specifiers } = node;

    if (source.value === 'lodash') {
      if (specifiers[0].type === 'ImportDefaultSpecifier') {
        // import _ from 'lodash';
        lodashIdentifier = specifiers[0].local.name;
      } else {
        // import { get } from 'lodash';
        specifiers.forEach(specifier => {
          const local = specifier.local.name;
          const imported = specifier.imported.name;
          mappedLodashImports.push({ local, imported });
        });
      }
    } else if (source.value.indexOf('lodash/') === 0) {
      // import get from 'lodash/get'
      const local = specifiers[0].local.name;
      const imported = source.value.substring(source.value.lastIndexOf('/') + 1);
      mappedLodashImports.push({ local, imported });
    }
  });

  // Now let's use these imports to transform to accessing members of `_`
  mappedLodashImports.forEach(importDescription => {
    ast
      .find(j.Identifier, {
        name: importDescription.local,
      })
      .forEach(path => {
        if (path.parent.node.type !== 'MemberExpression') {
          // We'll assume this was a destructured import
          path.replace(
            b.memberExpression(
              b.identifier(lodashIdentifier),
              b.identifier(importDescription.imported)
            )
          )
        }
      })
  })

  const newImport = b.importDeclaration(
    [b.importDefaultSpecifier(b.identifier(lodashIdentifier))],
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
