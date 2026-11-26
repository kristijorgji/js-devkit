import { typed } from '@kristijorgji/eslint-plugin';
import type { Linter } from 'eslint';

import { asyncSafetyRules, type AsyncSafetyOptions } from './async-safety.js';

export interface CreateTypedLintConfigOptions {
  /** Directory containing the consumer's `tsconfig.json`. */
  tsconfigRootDir: string;
  severity?: 'error' | 'warn';
  /**
   * Promise and switch safety rules. Default on; `false` disables; an object toggles single rules.
   */
  asyncSafety?: boolean | AsyncSafetyOptions;
}

/**
 * Type-aware ESLint block.
 * Enables `kj/no-weak-typeof-satisfies`, `@typescript-eslint/no-unnecessary-type-assertion`,
 * and the async-safety group (`no-floating-promises`, `no-misused-promises`, `await-thenable`,
 * `switch-exhaustiveness-check`).
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
      ...asyncSafetyRules(options.asyncSafety),
      ...weakTypeofConfig.rules,
    },
  };
}
