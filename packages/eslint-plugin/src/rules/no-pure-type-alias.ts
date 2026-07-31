import { AST_NODE_TYPES } from '@typescript-eslint/utils';

import { createRule } from '../utils/create-rule.js';

export interface NoPureTypeAliasOptions {
  /** Regex pattern strings; alias names matching any of them are allowed. */
  allowPatterns?: string[];
}

type Options = [NoPureTypeAliasOptions];
type MessageIds = 'pureAlias';

/**
 * Discourage pure re-alias declarations like `type A = B;` (identifier alias, no
 * generics/indexing). Use the original type directly instead.
 */
export const noPureTypeAlias = createRule<Options, MessageIds>({
  name: 'no-pure-type-alias',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Discourage pure type aliases; use the original type directly.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          allowPatterns: {
            type: 'array',
            items: { type: 'string' },
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      pureAlias:
        'Avoid pure type aliases (`type {{name}} = {{target}}`). Prefer the original type directly. If intentional, add an eslint-disable-next-line with a reason.',
    },
  },
  defaultOptions: [{ allowPatterns: [] }],
  create(context, [options]) {
    const allowPatterns = (options.allowPatterns ?? []).map((pattern) => new RegExp(pattern));

    return {
      TSTypeAliasDeclaration(node) {
        const ann = node.typeAnnotation;
        // Only flag `type A = SomeType` / `type A = Ns.Sub` with NO type arguments (a bare re-alias).
        if (ann.type !== AST_NODE_TYPES.TSTypeReference) return;
        if (ann.typeArguments) return;

        if (allowPatterns.some((pattern) => pattern.test(node.id.name))) {
          return;
        }

        const target =
          ann.typeName.type === AST_NODE_TYPES.Identifier
            ? ann.typeName.name
            : context.sourceCode.getText(ann.typeName);
        context.report({ node, messageId: 'pureAlias', data: { name: node.id.name, target } });
      },
    };
  },
});
