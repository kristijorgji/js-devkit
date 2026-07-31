import { typed } from '@kristijorgji/eslint-plugin';
import type { Linter } from 'eslint';

export interface CreateTypedLintConfigOptions {
  /** Directory containing the consumer's `tsconfig.json`. */
  tsconfigRootDir: string;
  severity?: 'error' | 'warn';
}

/**
 * Type-aware ESLint block (ported from prona365 `createTypedLintConfig`).
 * Enables `kj/no-weak-typeof-satisfies` plus `@typescript-eslint/no-unnecessary-type-assertion`.
 */
export function createTypedLintConfig(options: CreateTypedLintConfigOptions): Linter.Config {
  const [weakTypeofConfig] = typed({
    tsconfigRootDir: options.tsconfigRootDir,
    severity: options.severity,
  });

  if (!weakTypeofConfig) {
    throw new Error('typed() returned no config blocks');
  }

  return {
    ...weakTypeofConfig,
    rules: {
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      ...weakTypeofConfig.rules,
    },
  };
}
