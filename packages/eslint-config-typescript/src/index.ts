export { baseRules, createBaseConfig, type BaseConfigOptions, type BaseRulesOptions } from './base.js';
export {
  createTypescriptConfig,
  type CreateTypescriptConfigOptions,
} from './create-typescript-config.js';
export { ignores } from './ignores.js';
export {
  createImportOrderRules,
  defaultImportXOrderOptions,
  defaultSortImportsOptions,
  importOrderRules,
  type CreateImportOrderRulesOptions,
  type ImportXOrderOptions,
  type SortImportsOptions,
} from './import-order.js';
export { defaultPrettierOptions, prettierRules, type PrettierSetting } from './prettier.js';
export {
  createTypedLintConfig,
  type CreateTypedLintConfigOptions,
} from './typed.js';
