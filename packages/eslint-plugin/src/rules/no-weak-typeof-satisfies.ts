import { AST_NODE_TYPES, ESLintUtils, TSESTree } from '@typescript-eslint/utils';
import ts from 'typescript';

import { createRule } from '../utils/create-rule.js';

export interface NoWeakTypeofSatisfiesOptions {
  /** When true, only flag `any`, not `unknown`. Defaults to false. */
  allowUnknown?: boolean;
}

type Options = [NoWeakTypeofSatisfiesOptions];
type MessageIds = 'weakTypeof';

function isAnyOrUnknown(type: ts.Type, allowUnknown: boolean): boolean {
  const flags = allowUnknown ? ts.TypeFlags.Any : ts.TypeFlags.Any | ts.TypeFlags.Unknown;
  if (type.flags & flags) return true;
  if (type.isUnion()) {
    return type.types.every((part) => isAnyOrUnknown(part, allowUnknown));
  }
  return false;
}

function isTraversableNode(value: unknown): value is TSESTree.Node {
  return value != null && typeof value === 'object' && 'type' in value;
}

/**
 * Flags `typeof expr` inside `satisfies` when `expr` resolves to `any` or `unknown`.
 * Catches untyped `await res.json()` bodies and similar weak expectation typing.
 */
export const noWeakTypeofSatisfies = createRule<Options, MessageIds>({
  name: 'no-weak-typeof-satisfies',
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow typeof in satisfies when the expression type is any or unknown.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          allowUnknown: { type: 'boolean' },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      weakTypeof:
        'Do not use `typeof {{expr}}` in `satisfies` when it resolves to any/unknown. Use an exported API/domain type, ReturnType, or a named alias instead.',
    },
  },
  defaultOptions: [{ allowUnknown: false }],
  create(context, [options]) {
    const allowUnknown = options.allowUnknown ?? false;
    const services = ESLintUtils.getParserServices(context, /* allowWithoutFullTypeInformation */ true);
    if (!services.program) {
      return {};
    }
    const checker = services.program.getTypeChecker();

    function visit(node: TSESTree.Node | null | undefined): void {
      if (!isTraversableNode(node)) return;

      if (node.type === AST_NODE_TYPES.TSTypeQuery) {
        try {
          const tsNode = services.esTreeNodeToTSNodeMap.get(node);
          if (tsNode && ts.isTypeQueryNode(tsNode)) {
            const type = checker.getTypeFromTypeNode(tsNode);
            if (isAnyOrUnknown(type, allowUnknown)) {
              context.report({
                node,
                messageId: 'weakTypeof',
                data: { expr: context.sourceCode.getText(node.exprName) },
              });
            }
          }
        } catch {
          // Incomplete parser services — skip.
        }
      }

      for (const key of Object.keys(node)) {
        if (key === 'parent' || key === 'loc' || key === 'range' || key === 'type') continue;
        const child = (node as unknown as Record<string, unknown>)[key];
        if (!child || typeof child !== 'object') continue;
        if (Array.isArray(child)) {
          for (const item of child) {
            if (isTraversableNode(item)) visit(item);
          }
        } else if (isTraversableNode(child)) {
          visit(child);
        }
      }
    }

    return {
      TSSatisfiesExpression(node) {
        visit(node.typeAnnotation);
      },
    };
  },
});
