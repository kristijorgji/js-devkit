import type { Linter } from 'eslint';

export interface ImportXOrderOptions {
  groups?: (string | string[])[];
  pathGroups?: { pattern: string; group: string; position?: 'before' | 'after' }[];
  pathGroupsExcludedImportTypes?: string[];
  'newlines-between'?: 'always' | 'always-and-inside-groups' | 'never' | 'ignore';
  alphabetize?: { order: 'asc' | 'desc' | 'ignore'; caseInsensitive?: boolean };
  distinctGroup?: boolean;
  warnOnUnassignedImports?: boolean;
}

export interface SortImportsOptions {
  ignoreCase?: boolean;
  ignoreDeclarationSort?: boolean;
  ignoreMemberSort?: boolean;
  allowSeparatedGroups?: boolean;
  memberSyntaxSortOrder?: string[];
}

export const defaultImportXOrderOptions: ImportXOrderOptions = {
  groups: ['builtin', 'external', 'internal', ['parent', 'sibling']],
  'newlines-between': 'always',
  alphabetize: {
    order: 'asc',
    caseInsensitive: true,
  },
};

export const defaultSortImportsOptions: SortImportsOptions = {
  ignoreCase: true,
  ignoreDeclarationSort: true,
  ignoreMemberSort: false,
  allowSeparatedGroups: true,
};

/**
 * Import ordering rules using `eslint-plugin-import-x`.
 * Exported so consumers can compose without taking the full factory.
 * Prefer {@link createImportOrderRules} when you need overrides.
 */
export const importOrderRules: Linter.RulesRecord = {
  'import-x/first': 'error',
  'import-x/no-duplicates': 'error',
  'import-x/order': ['error', defaultImportXOrderOptions],
  'sort-imports': ['error', defaultSortImportsOptions],
};

export interface CreateImportOrderRulesOptions {
  /**
   * `import-x/order` options, shallow-merged over the defaults (arrays replace).
   * `false` disables the rule.
   */
  importOrder?: false | ImportXOrderOptions;
  /**
   * `sort-imports` options, shallow-merged over the defaults (arrays replace).
   * `false` disables the rule.
   */
  sortImports?: false | SortImportsOptions;
}

/**
 * Builds import-order related rules. Called with no arguments, the result is
 * deep-equal to {@link importOrderRules}.
 */
export function createImportOrderRules(
  options?: CreateImportOrderRulesOptions
): Linter.RulesRecord {
  const rules: Linter.RulesRecord = {
    'import-x/first': 'error',
    'import-x/no-duplicates': 'error',
  };

  if (options?.importOrder !== false) {
    rules['import-x/order'] = [
      'error',
      {
        ...defaultImportXOrderOptions,
        ...(options?.importOrder ?? {}),
      },
    ];
  }

  if (options?.sortImports !== false) {
    rules['sort-imports'] = [
      'error',
      {
        ...defaultSortImportsOptions,
        ...(options?.sortImports ?? {}),
      },
    ];
  }

  return rules;
}
