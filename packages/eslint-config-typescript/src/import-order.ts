import type { Linter } from 'eslint';

/**
 * Import ordering rules using `eslint-plugin-import-x`.
 * Exported so consumers can compose without taking the full factory.
 */
export const importOrderRules: Linter.RulesRecord = {
  'import-x/first': 'error',
  'import-x/no-duplicates': 'error',
  'import-x/order': [
    'error',
    {
      groups: ['builtin', 'external', 'internal', ['parent', 'sibling']],
      'newlines-between': 'always',
      alphabetize: {
        order: 'asc',
        caseInsensitive: true,
      },
    },
  ],
  'sort-imports': [
    'error',
    {
      ignoreCase: true,
      ignoreDeclarationSort: true,
      ignoreMemberSort: false,
      allowSeparatedGroups: true,
    },
  ],
};
