import type { Linter } from 'eslint';

import { plugin } from '../plugin.js';

export interface TypedOptions {
  /** Root directory used to resolve the TypeScript project service. */
  tsconfigRootDir: string;
  severity?: 'error' | 'warn';
}

/**
 * Type-aware rules that require parser services (a TypeScript program). Enables
 * `kj/no-weak-typeof-satisfies` with `parserOptions.projectService` pointed at
 * `tsconfigRootDir`. Returns a fresh array on every call.
 */
export function typed(options: TypedOptions): Linter.Config[] {
  const severity = options.severity ?? 'error';

  return [
    {
      plugins: { kj: plugin },
      languageOptions: {
        parserOptions: {
          projectService: true,
          tsconfigRootDir: options.tsconfigRootDir,
        },
      },
      rules: {
        'kj/no-weak-typeof-satisfies': severity,
      },
    },
  ];
}
