import type { RestrictedSyntaxEntry } from './types.js';

/**
 * In tests/stories, inline mock return values, JSON bodies, and expectation objects
 * must use `satisfies SomeType` (named type, not inline literals).
 */
export const mockBodySatisfiesSelectors: Record<string, RestrictedSyntaxEntry> = {
  mockReturnResolvedValue: {
    selector:
      'CallExpression[callee.property.name=/^(mockResolvedValue|mockReturnValue|mockResolvedValueOnce|mockReturnValueOnce)$/][arguments.0.type="ObjectExpression"]',
    message: 'Inline mock objects must use `satisfies SomeType` (e.g. mockResolvedValue({ ... } satisfies MyType)).',
  },
  expectationObject: {
    selector:
      'CallExpression[callee.property.name=/^(toEqual|toStrictEqual|toMatchObject)$/][arguments.0.type="ObjectExpression"]',
    message: 'Inline expectation objects must use `satisfies SomeType` (e.g. expect(x).toEqual({ ... } satisfies MyType)).',
  },
  jsonStringifyBody: {
    selector:
      'Property[key.name="body"] CallExpression[callee.object.name="JSON"][callee.property.name="stringify"][arguments.0.type="ObjectExpression"]',
    message: 'Inline JSON.stringify request bodies must use `satisfies SomeType`.',
  },
  inlineTypeLiteral: {
    selector: 'TSSatisfiesExpression > TSTypeLiteral',
    message:
      'Do not use an inline type literal with `satisfies`. Reference a named type, an existing type, or Awaited<ReturnType<typeof fn>> (declare a one-off `type X = {...}` alias if truly needed).',
  },
  recordStringUnknown: {
    selector:
      'TSSatisfiesExpression > TSTypeReference[typeName.name="Record"][typeArguments.params.0.type="TSStringKeyword"][typeArguments.params.1.type=/^(TSUnknownKeyword|TSAnyKeyword)$/]',
    message:
      'Do not use `satisfies Record<string, unknown|any>`. Use a domain type, NonNullable<typeof value>, Partial<…>, ReturnType/Awaited<ReturnType>, or a local named alias.',
  },
  weakSatisfiesKeyword: {
    selector: 'TSSatisfiesExpression > :matches(TSAnyKeyword, TSUnknownKeyword, TSObjectKeyword)',
    message:
      'Do not use weak `satisfies any|unknown|object`. Use a domain type, NonNullable<typeof value>, Partial<…>, ReturnType/Awaited<ReturnType>, or a local named alias.',
  },
};
