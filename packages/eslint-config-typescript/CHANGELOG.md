# @kristijorgji/eslint-config-typescript

## 1.2.2

### Patch Changes

- [#33](https://github.com/kristijorgji/js-devkit/pull/33) [`fe02963`](https://github.com/kristijorgji/js-devkit/commit/fe029635c036e9a485d26017f643f075998ecf6b) Thanks [@kristijorgji](https://github.com/kristijorgji)! - Add `jsxExplicitFunctionReturnType` so adopters can keep
  `explicit-function-return-type` on for `.tsx`/`.jsx` when `explicitTypes`
  enables that rule. Default remains `false` (rule off for JSX; returns inferred).
  Document the option from the typescript-config README cross-link.

## 1.2.1

### Patch Changes

- [#31](https://github.com/kristijorgji/js-devkit/pull/31) [`18636b0`](https://github.com/kristijorgji/js-devkit/commit/18636b0d320317ba3fb49b95a7cecdb7f768fcd0) Thanks [@kristijorgji](https://github.com/kristijorgji)! - When `explicitTypes` enables `explicit-function-return-type`, `createReactConfig` turns that rule off for `.tsx`/`.jsx` (JSX return types are inferred). Document the React-factory default and scrub private adopter names from public kit docs/comments/tests. Republishing react-config also floors the typescript-config dependency at the current workspace minor.

## 1.2.0

### Minor Changes

- [#29](https://github.com/kristijorgji/js-devkit/pull/29) [`c655ec3`](https://github.com/kristijorgji/js-devkit/commit/c655ec3a5dc09892ff54d50b32ad17a9b2057823) Thanks [@kristijorgji](https://github.com/kristijorgji)! - Restore typescript-eslint's `eslint-recommended` overrides in `baseRules` so TS-redundant core rules (`no-undef`, `no-redeclare`, `no-dupe-class-members`, …) stay disabled for `.ts`/`.tsx`, and add opt-in `codeQuality` / `explicitTypes` groups (with standalone `createCodeQualityConfig` / `createExplicitTypesConfig` for non-factory presets).

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
