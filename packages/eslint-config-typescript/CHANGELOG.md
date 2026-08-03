# @kristijorgji/eslint-config-typescript

## 1.1.0

### Minor Changes

- [#23](https://github.com/kristijorgji/js-devkit/pull/23) [`983822b`](https://github.com/kristijorgji/js-devkit/commit/983822b33895cdb17f2d483f0bc6a19ea1970913) Thanks [@kristijorgji](https://github.com/kristijorgji)! - Add `importOrder`, `sortImports`, and `prettier: 'prettierrc'` options (plus `createImportOrderRules`) so consumers can match repo Prettier and import style without local rule overrides.

### Patch Changes

- Updated dependencies [[`983822b`](https://github.com/kristijorgji/js-devkit/commit/983822b33895cdb17f2d483f0bc6a19ea1970913), [`983822b`](https://github.com/kristijorgji/js-devkit/commit/983822b33895cdb17f2d483f0bc6a19ea1970913)]:
  - @kristijorgji/eslint-plugin@0.2.0

## 1.0.0

### Major Changes

- [`a04b020`](https://github.com/kristijorgji/js-devkit/commit/a04b020863c5061d5cbfc1161d2edea2fe7f156c) Thanks [@kristijorgji](https://github.com/kristijorgji)! - Fold `@kristijorgji/eslint-config-typescript` into the js-devkit monorepo as an ESM flat-config factory (`createTypescriptConfig`), built on `@kristijorgji/eslint-plugin`.

  **Migration:** replace `extends` / FlatCompat usage with:

  ```js
  import { createTypescriptConfig } from "@kristijorgji/eslint-config-typescript";
  export default createTypescriptConfig({
    tsconfigRootDir: import.meta.dirname,
  });
  ```

  Vendored from kristijorgji/eslint-config-typescript@702410cb. Breaking: CJS `index.cjs` removed; `eslint`/`typescript`/`prettier` are peers; import plugin is `eslint-plugin-import-x`.
