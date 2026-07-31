import { TSESTree } from '@typescript-eslint/utils';

import { createRule } from '../utils/create-rule.js';

export interface NoMultiCompOptions {
  /** Maximum number of components allowed per file. Defaults to 1. */
  max?: number;
  /** When true, only class components count towards the limit. Defaults to false. */
  ignoreStateless?: boolean;
}

type Options = [NoMultiCompOptions];
type MessageIds = 'tooMany';

function isComponentName(name: string | null | undefined): boolean {
  return typeof name === 'string' && /^[A-Z]/.test(name);
}

function isFunctionLike(node: TSESTree.Node | null | undefined): boolean {
  return (
    node != null &&
    (node.type === TSESTree.AST_NODE_TYPES.FunctionExpression ||
      node.type === TSESTree.AST_NODE_TYPES.ArrowFunctionExpression ||
      node.type === TSESTree.AST_NODE_TYPES.FunctionDeclaration)
  );
}

/**
 * Warn when a file declares more than the configured number of PascalCase React
 * components. Replaces eslint-plugin-react's `react/no-multi-comp`.
 */
export const noMultiComp = createRule<Options, MessageIds>({
  name: 'no-multi-comp',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow multiple React components in a single file',
    },
    schema: [
      {
        type: 'object',
        properties: {
          max: { type: 'number', minimum: 1 },
          ignoreStateless: { type: 'boolean' },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      tooMany:
        'Declare only one React component per file (found {{count}}). Extract extras into their own modules.',
    },
  },
  defaultOptions: [{ max: 1, ignoreStateless: false }],
  create(context, [options]) {
    const max = options.max ?? 1;
    const ignoreStateless = options.ignoreStateless ?? false;
    const components: TSESTree.Node[] = [];

    return {
      FunctionDeclaration(node) {
        if (ignoreStateless) {
          return;
        }
        if (isComponentName(node.id?.name)) {
          components.push(node);
        }
      },
      VariableDeclarator(node) {
        if (ignoreStateless) {
          return;
        }
        if (
          node.id.type === TSESTree.AST_NODE_TYPES.Identifier &&
          isComponentName(node.id.name) &&
          isFunctionLike(node.init)
        ) {
          components.push(node);
        }
      },
      ClassDeclaration(node) {
        if (isComponentName(node.id?.name)) {
          components.push(node);
        }
      },
      'Program:exit'() {
        if (components.length <= max) {
          return;
        }
        for (const node of components.slice(max)) {
          context.report({
            node,
            messageId: 'tooMany',
            data: { count: String(components.length) },
          });
        }
      },
    };
  },
});
