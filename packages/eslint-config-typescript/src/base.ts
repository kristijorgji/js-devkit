import js from '@eslint/js';
import { plugin as kjPlugin } from '@kristijorgji/eslint-plugin';
import type { Linter } from 'eslint';
import importX from 'eslint-plugin-import-x';
import prettierPlugin from 'eslint-plugin-prettier';
import globals from 'globals';
import tseslint from 'typescript-eslint';

import { importOrderRules } from './import-order.js';
import { defaultPrettierOptions, prettierRules } from './prettier.js';

export interface BaseRulesOptions {
  /** Whether to enable `prettier/prettier`. Defaults to true. */
  prettier?: boolean | typeof defaultPrettierOptions;
}

/**
 * Core TypeScript lint rules (no type-aware block).
 * Includes `kj/no-pure-type-alias` only — single-export barrels and JSX prop order
 * belong on the React factory (prona/sb split placement).
 */
export function baseRules(options?: BaseRulesOptions): Linter.RulesRecord {
  const prettier = options?.prettier ?? true;
  const prettierOpts =
    prettier === false ? null : prettier === true ? defaultPrettierOptions : prettier;

  return {
    ...js.configs.recommended.rules,
    'no-unused-vars': 'off',
    ...importOrderRules,
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
    ...(prettierOpts ? prettierRules(prettierOpts) : {}),
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
