import type { Linter } from 'eslint';

import { plugin } from '../plugin.js';

export interface RecommendedOptions {
  severity?: 'error' | 'warn';
}

/**
 * Baseline recommended rules. `no-multi-comp` and `no-barrel` are intentionally left
 * out (see `componentExtraction()` and `restrictedSyntax()`/manual opt-in respectively).
 * Returns a fresh array on every call.
 */
export function recommended(options?: RecommendedOptions): Linter.Config[] {
  const severity = options?.severity ?? 'error';

  return [
    {
      plugins: { kj: plugin },
      rules: {
        'kj/no-pure-type-alias': severity,
        'kj/no-single-export-barrel': severity,
        'kj/no-weak-typeof-satisfies': severity,
        'kj/jsx-leading-prop-order': severity,
      },
    },
  ];
}
