import prettierConfig from 'eslint-config-prettier';
import type { Linter } from 'eslint';
import type { Options as PrettierOptions } from 'prettier';
import tseslint from 'typescript-eslint';

import { createBaseConfig } from './base.js';
import { ignores as defaultIgnores } from './ignores.js';
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
   * Prettier integration. `true` (default) uses package defaults; pass an options
   * object to override; `false` disables `prettier/prettier` (still applies prettierConfig last).
   */
  prettier?: boolean | PrettierOptions;
  /** Extra ignore patterns merged into the default ignores block. */
  ignores?: string[];
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
    }),
  ];

  if (options.tsconfigRootDir) {
    configs.push(createTypedLintConfig({ tsconfigRootDir: options.tsconfigRootDir }));
  }

  configs.push(prettierConfig);

  return configs;
}
