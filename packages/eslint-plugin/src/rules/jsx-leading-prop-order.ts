import { AST_NODE_TYPES, TSESLint, TSESTree } from '@typescript-eslint/utils';

import { createRule } from '../utils/create-rule.js';

export interface JsxLeadingPropOrderOptions {
  order?: string[];
}

type Options = [JsxLeadingPropOrderOptions];
type MessageIds = 'outOfOrder';

export const DEFAULT_ORDER = ['data-testid', 'testID', 'key', 'ref', 'id', 'name'];

type JsxAttr = TSESTree.JSXAttribute | TSESTree.JSXSpreadAttribute;

function attrName(node: JsxAttr): string | null {
  if (node.type !== AST_NODE_TYPES.JSXAttribute) {
    return null;
  }
  const name = node.name;
  if (name.type === AST_NODE_TYPES.JSXIdentifier) {
    return name.name;
  }
  if (name.type === AST_NODE_TYPES.JSXNamespacedName) {
    return `${name.namespace.name}:${name.name.name}`;
  }
  return null;
}

function stableSortByRank<T>(segment: T[], getRank: (attr: T) => number): T[] {
  return segment
    .map((attr, index) => ({ attr, index, rank: getRank(attr) }))
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .map(({ attr }) => attr);
}

/** Split JSX attributes into segments separated by spreads. */
function attributeSegments(attrs: readonly JsxAttr[]): TSESTree.JSXAttribute[][] {
  const segments: TSESTree.JSXAttribute[][] = [];
  let current: TSESTree.JSXAttribute[] = [];

  for (const attr of attrs) {
    if (attr.type === AST_NODE_TYPES.JSXSpreadAttribute) {
      if (current.length > 0) {
        segments.push(current);
        current = [];
      }
      continue;
    }
    current.push(attr);
  }

  if (current.length > 0) {
    segments.push(current);
  }

  return segments;
}

/**
 * Enforce a configurable leading order for specific JSX attributes.
 * Other props stay unordered relative to each other (stable sort by rank).
 * Never moves attributes across JSXSpreadAttribute boundaries.
 */
export const jsxLeadingPropOrder = createRule<Options, MessageIds>({
  name: 'jsx-leading-prop-order',
  meta: {
    type: 'layout',
    docs: {
      description: 'Require configured leading JSX attributes to appear in order; never reorder across spreads',
    },
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          order: {
            type: 'array',
            items: { type: 'string' },
            minItems: 1,
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      outOfOrder: 'JSX attributes must follow leading prop order ({{order}}).',
    },
  },
  defaultOptions: [{ order: DEFAULT_ORDER }],
  create(context, [options]) {
    const order = options.order ?? DEFAULT_ORDER;
    const rankByName = new Map(order.map((name, index) => [name, index]));
    const sourceCode = context.sourceCode;

    function getRank(attr: TSESTree.JSXAttribute): number {
      const name = attrName(attr);
      if (name === null || !rankByName.has(name)) {
        return Number.POSITIVE_INFINITY;
      }
      return rankByName.get(name) as number;
    }

    function fixSegment(segment: TSESTree.JSXAttribute[], sorted: TSESTree.JSXAttribute[]) {
      return (fixer: TSESLint.RuleFixer) => {
        const separators: string[] = [];
        for (let i = 0; i < segment.length - 1; i++) {
          const left = segment[i];
          const right = segment[i + 1];
          if (!left || !right) continue;
          separators.push(sourceCode.text.slice(left.range[1], right.range[0]));
        }

        const firstSorted = sorted[0];
        if (!firstSorted) {
          return null;
        }
        const parts = [sourceCode.getText(firstSorted)];
        for (let i = 0; i < separators.length; i++) {
          const next = sorted[i + 1];
          if (!next) continue;
          parts.push(separators[i] ?? '', sourceCode.getText(next));
        }

        const first = segment[0];
        const last = segment[segment.length - 1];
        if (!first || !last) {
          return null;
        }
        return fixer.replaceTextRange([first.range[0], last.range[1]], parts.join(''));
      };
    }

    return {
      JSXOpeningElement(node) {
        const attrs = node.attributes;
        if (attrs.length < 2) {
          return;
        }

        for (const segment of attributeSegments(attrs)) {
          if (segment.length < 2) {
            continue;
          }

          const sorted = stableSortByRank(segment, getRank);
          const firstMismatch = segment.findIndex((attr, i) => attr !== sorted[i]);
          if (firstMismatch === -1) {
            continue;
          }

          const reportNode = segment[firstMismatch];
          if (!reportNode) {
            continue;
          }

          context.report({
            node: reportNode,
            messageId: 'outOfOrder',
            data: { order: order.join(', ') },
            fix: fixSegment(segment, sorted),
          });
        }
      },
    };
  },
});
