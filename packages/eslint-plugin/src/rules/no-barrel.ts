import { TSESTree } from '@typescript-eslint/utils';

import { createRule } from '../utils/create-rule.js';

export interface NoBarrelOptions {
  /** The package name whose barrel import is disallowed, e.g. `@repo/utils`. */
  packageName: string;
  /** An example subpath import to suggest instead, e.g. `@repo/utils/media`. */
  exampleSubpath: string;
}

type Options = [NoBarrelOptions];
type MessageIds = 'noBarrel';

type BarrelDeclaration =
  | TSESTree.ImportDeclaration
  | TSESTree.ExportNamedDeclaration
  | TSESTree.ExportAllDeclaration;

/** Disallow workspace package barrel imports — use domain subpaths instead. */
export const noBarrel = createRule<Options, MessageIds>({
  name: 'no-barrel',
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow package barrel imports; require domain subpath imports instead.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          packageName: { type: 'string' },
          exampleSubpath: { type: 'string' },
        },
        required: ['packageName', 'exampleSubpath'],
        additionalProperties: false,
      },
    ],
    messages: {
      noBarrel: 'Import from {{packageName}} subpaths (e.g. {{exampleSubpath}}), not the package barrel.',
    },
  },
  defaultOptions: [{ packageName: '', exampleSubpath: '' }],
  create(context, [options]) {
    const { packageName, exampleSubpath } = options;

    function reportBarrel(node: BarrelDeclaration) {
      if (node.source?.value !== packageName) return;
      context.report({
        node: node.source,
        messageId: 'noBarrel',
        data: { packageName, exampleSubpath },
      });
    }

    return {
      ImportDeclaration: reportBarrel,
      ExportNamedDeclaration: reportBarrel,
      ExportAllDeclaration: reportBarrel,
    };
  },
});
