import js from '@eslint/js';
import { plugin as kjPlugin } from '@kristijorgji/eslint-plugin';
import type { Linter } from 'eslint';
import importX from 'eslint-plugin-import-x';
import prettierPlugin from 'eslint-plugin-prettier';
import globals from 'globals';
import tseslint from 'typescript-eslint';

import {
  createImportOrderRules,
  type ImportXOrderOptions,
  type SortImportsOptions,
} from './import-order.js';
import { defaultPrettierOptions, prettierRules, type PrettierSetting } from './prettier.js';

export interface BaseRulesOptions {
  /**
   * Prettier integration. `true` (default) uses package defaults; `'prettierrc'`
   * defers to the consumer's Prettier config file; pass an options object to
   * replace defaults; `false` disables `prettier/prettier`.
   */
  prettier?: PrettierSetting;
  /** `import-x/order` options (shallow merge). `false` disables the rule. */
  importOrder?: false | ImportXOrderOptions;
  /** `sort-imports` options (shallow merge). `false` disables the rule. */
  sortImports?: false | SortImportsOptions;
}

/**
 * Core TypeScript lint rules (no type-aware block).
 * Includes `kj/no-pure-type-alias` only — single-export barrels and JSX prop order
 * belong on the React factory.
 */
export function baseRules(options?: BaseRulesOptions): Linter.RulesRecord {
  const prettier = options?.prettier ?? true;
  let prettierRuleBlock: Linter.RulesRecord = {};
  if (prettier === 'prettierrc') {
    prettierRuleBlock = prettierRules('prettierrc');
  } else if (prettier === true) {
    prettierRuleBlock = prettierRules(defaultPrettierOptions);
  } else if (prettier !== false) {
    prettierRuleBlock = prettierRules(prettier);
  }

  return {
    ...js.configs.recommended.rules,
    'no-unused-vars': 'off',
    ...createImportOrderRules({
      importOrder: options?.importOrder,
      sortImports: options?.sortImports,
    }),
    'import-x/no-unresolved': 'off',
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        args: 'all',
        argsIgnorePattern: '^_',
        caughtErrors: 'all',
        caughtErrorsIgnorePattern: '^_',
        destructuredArrayIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        ignoreRestSiblings: true,
      },
    ],
    'kj/no-pure-type-alias': 'error',
    ...prettierRuleBlock,
  };
}

export interface BaseConfigOptions extends BaseRulesOptions {
  files?: string[];
}

/** Flat config block for TypeScript sources (parser + plugins + base rules). */
export function createBaseConfig(options?: BaseConfigOptions): Linter.Config {
  const files = options?.files ?? ['**/*.{ts,tsx}'];

  return {
    files,
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.es2021,
      },
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      'import-x': importX,
      prettier: prettierPlugin,
      kj: kjPlugin,
    },
    rules: baseRules(options),
  };
}
