'use strict';

/**
 * Circular-reference guard plugin — functional re-implementation of Creator's
 * `plugin-detect-circular` (creator-programming-mod-lo). Creator's original
 * calls the standalone `traverse(node, visitor)` without a scope, which blows
 * up ("Couldn't find a Program" / "scope undefined") under our direct
 * babel.transformSync invocation; this version uses `programPath.traverse`
 * from the live traversal context instead. Output semantics match Creator's
 * preview chunks:
 *
 *   let _crd = true;
 *   import * as _reporterNs from '<reporter.moduleName>';
 *   function _reportPossibleCrUseOfX(extras) {
 *     (_reporterNs.report)("X", "<module request>", import.meta, extras);
 *   }
 *   ... X used as (_crd && X === void 0 ? (_reportPossibleCrUseOfX({error:Error()}), X) : X) ...
 *   _crd = false;
 *
 * So a module caught in an import cycle logs a diagnosable warning instead of
 * a bare "X is not a function".
 */

module.exports = function pluginCr({ types: t }) {
  return {
    name: 'detect-circular-reference',
    visitor: {
      Program: {
        enter(programPath, state) {
          const opts = state.opts || {};
          if (!opts.reporter) throw new Error(`'reporter' option is required.`);
          const filters = opts.moduleRequestFilter
            ? [].concat(opts.moduleRequestFilter)
            : [];

          const crdId = programPath.scope.generateUid('_crd');
          const reporterNsName = programPath.scope.generateUid('_reporterNs');
          const reportFxs = [];

          const isTypePosition = (refPath) => refPath.parent && refPath.parent.type.startsWith('TS');

          programPath.traverse({
            ImportDeclaration(importPath) {
              const request = importPath.node.source.value;
              if (filters.some((re) => request.match(re))) return;
              for (const specifier of importPath.node.specifiers) {
                if (t.isImportNamespaceSpecifier(specifier)) continue;
                const local = specifier.local.name;
                const binding = importPath.scope.getBinding(local);
                if (!binding || binding.referencePaths.length === 0) continue;

                const reportFxName = programPath.scope.generateUid(`reportPossibleCrUseOf${local}`);
                // function _reportPossibleCrUseOfX(extras) {
                //   (_reporterNs.report)("X", "<request>", import.meta, extras);
                // }
                reportFxs.push(t.functionDeclaration(
                  t.identifier(reportFxName),
                  [t.identifier('extras')],
                  t.blockStatement([t.expressionStatement(t.callExpression(
                    t.memberExpression(t.identifier(reporterNsName), t.identifier(opts.reporter.functionName)),
                    [
                      t.stringLiteral(local),
                      t.stringLiteral(request),
                      t.metaProperty(t.identifier('import'), t.identifier('meta')),
                      t.identifier('extras'),
                    ],
                  ))]),
                ));

                for (const refPath of binding.referencePaths) {
                  if (!t.isIdentifier(refPath.node)) continue;
                  if (t.isExportSpecifier(refPath.parent) || t.isImportSpecifier(refPath.parent)) continue;
                  if (isTypePosition(refPath)) continue;
                  // (_crd && X === void 0 ? (_reportPossibleCrUseOfX({error:Error()}), X) : X)
                  refPath.replaceWith(t.conditionalExpression(
                    t.logicalExpression('&&',
                      t.identifier(crdId),
                      t.binaryExpression('===', t.identifier(local), t.unaryExpression('void', t.numericLiteral(0)))),
                    t.sequenceExpression([
                      t.callExpression(t.identifier(reportFxName), [
                        t.objectExpression([t.objectProperty(
                          t.identifier('error'),
                          t.newExpression(t.identifier('Error'), []),
                        )]),
                      ]),
                      t.identifier(local),
                    ]),
                    t.identifier(local),
                  ));
                  refPath.skip();
                }
              }
            },
          });

          if (reportFxs.length === 0) return;
          programPath.node.body.unshift(
            t.variableDeclaration('let', [t.variableDeclarator(t.identifier(crdId), t.booleanLiteral(true))]),
          );
          programPath.node.body.unshift(t.importDeclaration(
            [t.importNamespaceSpecifier(t.identifier(reporterNsName))],
            t.stringLiteral(opts.reporter.moduleName),
          ));
          programPath.node.body.push(...reportFxs);
          programPath.node.body.push(t.expressionStatement(
            t.assignmentExpression('=', t.identifier(crdId), t.booleanLiteral(false)),
          ));
        },
      },
    },
  };
};
