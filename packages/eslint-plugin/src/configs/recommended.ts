import type { Linter } from 'eslint';

import { plugin } from '../plugin.js';

export interface RecommendedOptions {
  severity?: 'error' | 'warn';
}

/**
 * Baseline recommended rules for TypeScript/TSX files.
 * `kj/no-weak-typeof-satisfies` is type-aware — enable it via `typed()` instead.
 * `no-multi-comp` and `no-barrel` are intentionally left out (see `componentExtraction()`
 * and manual opt-in respectively). Returns a fresh array on every call.
 */
export function recommended(options?: RecommendedOptions): Linter.Config[] {
  const severity = options?.severity ?? 'error';

  return [
    {
      files: ['**/*.{ts,tsx}'],
      plugins: { kj: plugin },
      rules: {
        'kj/no-pure-type-alias': severity,
        'kj/no-single-export-barrel': severity,
        'kj/jsx-leading-prop-order': severity,
      },
    },
  ];
}
