import type { Linter } from 'eslint';
import type { Options as PrettierOptions } from 'prettier';

/** Default Prettier options embedded in `prettier/prettier` (legacy config parity). */
export const defaultPrettierOptions: PrettierOptions = {
  arrowParens: 'avoid',
  bracketSpacing: true,
  printWidth: 120,
  semi: true,
  singleQuote: true,
  tabWidth: 4,
  trailingComma: 'all',
  useTabs: false,
  endOfLine: 'lf',
};

/**
 * Prettier integration setting.
 * - `true` (default): embed {@link defaultPrettierOptions}
 * - `'prettierrc'`: emit bare `'prettier/prettier': 'error'` so the consumer's
 *   `.prettierrc` / `.prettierrc.js` is the single source of truth
 * - object: replace the defaults entirely (not deep-merged)
 * - `false`: omit the rule
 */
export type PrettierSetting = boolean | 'prettierrc' | PrettierOptions;

/**
 * Builds the `prettier/prettier` rule entry.
 * Pass `false` to `createTypescriptConfig({ prettier: false })` to skip.
 */
export function prettierRules(
  options: PrettierOptions | 'prettierrc' = defaultPrettierOptions
): Linter.RulesRecord {
  if (options === 'prettierrc') {
    return {
      'prettier/prettier': 'error',
    };
  }

  return {
    'prettier/prettier': ['error', options],
  };
}
