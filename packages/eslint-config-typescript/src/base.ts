import js from '@eslint/js';
import { plugin as kjPlugin } from '@kristijorgji/eslint-plugin';
import type { Linter } from 'eslint';
import importX from 'eslint-plugin-import-x';
import prettierPlugin from 'eslint-plugin-prettier';
import globals from 'globals';
import tseslint from 'typescript-eslint';

import {
  codeQualityPlugins,
  codeQualityRules,
  type CodeQualityOptions,
} from './code-quality.js';
import {
  explicitTypesRules,
  type ExplicitTypesOptions,
} from './explicit-types.js';
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
  /**
   * Opt-in sonarjs duplication subset + unused-imports / unused private members.
   * `true` enables defaults; an object toggles subgroups; omit / `false` leaves off.
   */
  codeQuality?: boolean | CodeQualityOptions;
  /**
   * Opt-in consistent-type-* and explicit-* typing rules shared by consumers.
   * `true` enables defaults; an object toggles individual rules; omit / `false` leaves off.
   */
  explicitTypes?: boolean | ExplicitTypesOptions;
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
    // Restore typescript-eslint's eslint-recommended compatibility overrides.
    // js.configs.recommended re-enables rules TypeScript already covers
    // (no-undef, no-redeclare, no-dupe-class-members, ...).
    ...tseslint.configs.eslintRecommended.rules,
    // Deliberate deviations from eslint-recommended, matching both consumers:
    // tsc only surfaces unreachable code as an editor suggestion unless
    // allowUnreachableCode: false is set, so keep the lint rule.
    'no-unreachable': 'error',
    '@typescript-eslint/no-unused-expressions': [
      'error',
      { allowShortCircuit: true, allowTernary: true, allowTaggedTemplates: true },
    ],
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
    ...codeQualityRules(options?.codeQuality),
    ...explicitTypesRules(options?.explicitTypes),
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
      ...codeQualityPlugins(options?.codeQuality),
    },
    rules: baseRules(options),
  };
}
