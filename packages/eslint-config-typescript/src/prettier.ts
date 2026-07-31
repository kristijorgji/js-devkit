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
 * Builds the `prettier/prettier` rule entry.
 * Pass `false` to `createTypescriptConfig({ prettier: false })` to skip.
 */
export function prettierRules(options: PrettierOptions = defaultPrettierOptions): Linter.RulesRecord {
  return {
    'prettier/prettier': ['error', options],
  };
}
