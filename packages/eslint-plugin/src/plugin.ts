import type { ESLint } from 'eslint';

import { noBarrel } from './rules/no-barrel.js';
import { noMultiComp } from './rules/no-multi-comp.js';
import { noPureTypeAlias } from './rules/no-pure-type-alias.js';
import { noSingleExportBarrel } from './rules/no-single-export-barrel.js';
import { noWeakTypeofSatisfies } from './rules/no-weak-typeof-satisfies.js';

/**
 * The `kj` plugin object. Kept in its own module (separate from `index.ts` and the
 * config factories) so config factories can import it without creating a circular
 * dependency with the package's public entry point.
 */
const rules = {
  'no-multi-comp': noMultiComp,
  'no-pure-type-alias': noPureTypeAlias,
  'no-single-export-barrel': noSingleExportBarrel,
  'no-weak-typeof-satisfies': noWeakTypeofSatisfies,
  'no-barrel': noBarrel,
};

export const plugin: ESLint.Plugin = {
  meta: {
    name: '@kristijorgji/eslint-plugin',
    version: '0.1.0',
  },
  // `@typescript-eslint/utils` rule modules are structurally richer than `eslint`'s
  // `Rule.RuleModule` (typed context, typed options) but are runtime-compatible;
  // ESLint only consumes the shared `meta`/`create` shape at plugin-load time.
  rules: rules as unknown as ESLint.Plugin['rules'],
};

export default plugin;
