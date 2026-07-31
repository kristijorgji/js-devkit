import { plugin } from './plugin.js';

export default plugin;
export { plugin };

export * from './configs/recommended.js';
export * from './configs/typed.js';
export * from './configs/component-extraction.js';

export * from './selectors/object-literal-typing.js';
export * from './selectors/mock-body-satisfies.js';
export * from './selectors/restricted-syntax.js';
export * from './selectors/types.js';

export type { NoMultiCompOptions } from './rules/no-multi-comp.js';
export type { NoPureTypeAliasOptions } from './rules/no-pure-type-alias.js';
export type { NoSingleExportBarrelOptions } from './rules/no-single-export-barrel.js';
export type { NoWeakTypeofSatisfiesOptions } from './rules/no-weak-typeof-satisfies.js';
export type { JsxLeadingPropOrderOptions } from './rules/jsx-leading-prop-order.js';
export type { NoBarrelOptions } from './rules/no-barrel.js';
