import type { RestrictedSyntaxEntry } from './types.js';

/**
 * Const-bound object/array/JSX locals must use `: Type` on the binding (not bare
 * literals or `satisfies` on the initializer).
 */
export const objectLiteralTypingSelectors: Record<string, RestrictedSyntaxEntry> = {
  objectOrArrayBinding: {
    selector:
      'VariableDeclarator[init.type=/^(ObjectExpression|ArrayExpression)$/] > Identifier:not([typeAnnotation])',
    message:
      'Object and array values must use an explicit type annotation on the binding (e.g. const data: MyType = { ... }).',
  },
  jsxBinding: {
    selector: 'VariableDeclarator[init.type="JSXElement"] > Identifier:not([typeAnnotation])',
    message: 'JSX values must use an explicit type annotation on the binding (e.g. const node: ReactElement = <App />).',
  },
  satisfiesOnConstBinding: {
    selector:
      'VariableDeclarator[init.type="TSSatisfiesExpression"][init.expression.type=/^(ObjectExpression|ArrayExpression)$/] > Identifier:not([typeAnnotation])',
    message:
      'Prefer `const x: MyType = { ... }` for const-bound mocks; reserve `satisfies` for inline mockReturnValue/mockResolvedValue arguments.',
  },
  asNeverLiteral: {
    selector:
      'TSAsExpression[typeAnnotation.type="TSNeverKeyword"][expression.type=/^(ObjectExpression|ArrayExpression)$/]',
    message:
      'Use satisfies TargetType instead of as never on object/array literals (e.g. mockReturnValueOnce({ ... } satisfies MyType)).',
  },
};
