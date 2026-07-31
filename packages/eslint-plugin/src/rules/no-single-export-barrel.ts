import { AST_NODE_TYPES, TSESTree } from '@typescript-eslint/utils';

import { createRule } from '../utils/create-rule.js';

export interface NoSingleExportBarrelOptions {
  /** Regex pattern (as a string) that qualifying export names must match. Defaults to `^[A-Z]`. */
  exportNamePattern?: string;
}

type Options = [NoSingleExportBarrelOptions];
type MessageIds = 'noSingleExportBarrel';

interface SingleReExport {
  node: TSESTree.ExportNamedDeclaration;
  exportName: string;
  source: string;
}

/**
 * Ban thin `index.ts` barrels that only re-export a single symbol (usually a React
 * component) from a sibling path — import the module file directly instead.
 * Allows multi-export domain/index barrels.
 */
function getSingleReExport(program: TSESTree.Program): SingleReExport | null {
  const reExports: TSESTree.ExportNamedDeclaration[] = [];
  for (const statement of program.body) {
    if (statement.type === AST_NODE_TYPES.ExportNamedDeclaration && statement.source) {
      reExports.push(statement);
      continue;
    }
    // Anything else (imports, declarations, export *) disqualifies the thin-barrel pattern.
    return null;
  }
  if (reExports.length === 0) {
    return null;
  }

  const specs: SingleReExport[] = [];
  for (const decl of reExports) {
    const source = typeof decl.source?.value === 'string' ? decl.source.value : null;
    if (!source) {
      return null;
    }
    for (const spec of decl.specifiers) {
      if (spec.type !== AST_NODE_TYPES.ExportSpecifier) {
        return null;
      }
      const exportName = spec.exported.type === AST_NODE_TYPES.Identifier ? spec.exported.name : null;
      if (!exportName) {
        return null;
      }
      specs.push({ node: decl, exportName, source });
    }
  }

  if (specs.length !== 1) {
    return null;
  }

  return specs[0] ?? null;
}

export const noSingleExportBarrel = createRule<Options, MessageIds>({
  name: 'no-single-export-barrel',
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow index.ts barrels that only re-export a single symbol from a sibling module',
    },
    schema: [
      {
        type: 'object',
        properties: {
          exportNamePattern: { type: 'string' },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      noSingleExportBarrel:
        "Avoid a single-export index barrel (`export { {{name}} } from '{{source}}'`). Import `{{source}}` directly and delete this file.",
    },
  },
  defaultOptions: [{ exportNamePattern: '^[A-Z]' }],
  create(context, [options]) {
    const filename = context.filename.replace(/\\/g, '/');
    if (!/(^|\/)index\.tsx?$/.test(filename)) {
      return {};
    }

    const exportNamePattern = new RegExp(options.exportNamePattern ?? '^[A-Z]');

    return {
      Program(node) {
        const single = getSingleReExport(node);
        if (!single) {
          return;
        }
        // Component-style (PascalCase, by default) or obvious UI modules only.
        if (!exportNamePattern.test(single.exportName)) {
          return;
        }
        context.report({
          node: single.node,
          messageId: 'noSingleExportBarrel',
          data: { name: single.exportName, source: single.source },
        });
      },
    };
  },
});
