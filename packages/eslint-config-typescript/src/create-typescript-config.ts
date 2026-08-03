import prettierConfig from 'eslint-config-prettier';
import type { Linter } from 'eslint';
import tseslint from 'typescript-eslint';

import { createBaseConfig } from './base.js';
import { ignores as defaultIgnores } from './ignores.js';
import type { ImportXOrderOptions, SortImportsOptions } from './import-order.js';
import type { PrettierSetting } from './prettier.js';
import { createTypedLintConfig } from './typed.js';

export interface CreateTypescriptConfigOptions {
  /** Glob patterns for TypeScript files. Defaults to all `.ts` / `.tsx` files. */
  files?: string[];
  /**
   * When set, appends the type-aware block (`createTypedLintConfig`).
   * Required for `kj/no-weak-typeof-satisfies`.
   */
  tsconfigRootDir?: string;
  /**
   * Prettier integration. `true` (default) uses package defaults; `'prettierrc'`
   * defers to the consumer's Prettier config file; pass an options object to
   * replace defaults; `false` disables `prettier/prettier` (still applies
   * eslint-config-prettier last).
   */
  prettier?: PrettierSetting;
  /** Extra ignore patterns merged into the default ignores block. */
  ignores?: string[];
  /** `import-x/order` options (shallow merge). `false` disables the rule. */
  importOrder?: false | ImportXOrderOptions;
  /** `sort-imports` options (shallow merge). `false` disables the rule. */
  sortImports?: false | SortImportsOptions;
}

/**
 * Flat ESLint config factory for TypeScript projects.
 *
 * Enables `kj/no-pure-type-alias` only from the plugin recommended set.
 * Use `@kristijorgji/eslint-config-react-typescript` for JSX prop order,
 * single-export barrels, and component-extraction rules.
 */
export function createTypescriptConfig(options: CreateTypescriptConfigOptions = {}): Linter.Config[] {
  const files = options.files ?? ['**/*.{ts,tsx}'];
  const ignorePatterns = options.ignores ?? [];

  const configs: Linter.Config[] = [
    {
      ignores: [...(defaultIgnores.ignores ?? []), ...ignorePatterns],
    },
    ...tseslint.configs.recommended,
    createBaseConfig({
      files,
      prettier: options.prettier,
      importOrder: options.importOrder,
      sortImports: options.sortImports,
    }),
  ];

  if (options.tsconfigRootDir) {
    configs.push(createTypedLintConfig({ tsconfigRootDir: options.tsconfigRootDir }));
  }

  configs.push(prettierConfig);

  return configs;
}
