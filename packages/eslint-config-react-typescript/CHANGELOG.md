# @kristijorgji/eslint-config-react-typescript

## 2.2.0

### Minor Changes

- [#33](https://github.com/kristijorgji/js-devkit/pull/33) [`fe02963`](https://github.com/kristijorgji/js-devkit/commit/fe029635c036e9a485d26017f643f075998ecf6b) Thanks [@kristijorgji](https://github.com/kristijorgji)! - Add `jsxExplicitFunctionReturnType` so adopters can keep
  `explicit-function-return-type` on for `.tsx`/`.jsx` when `explicitTypes`
  enables that rule. Default remains `false` (rule off for JSX; returns inferred).
  Document the option from the typescript-config README cross-link.

### Patch Changes

- Updated dependencies [[`fe02963`](https://github.com/kristijorgji/js-devkit/commit/fe029635c036e9a485d26017f643f075998ecf6b)]:
  - @kristijorgji/eslint-config-typescript@1.2.2

## 2.1.0

### Minor Changes

- [#31](https://github.com/kristijorgji/js-devkit/pull/31) [`18636b0`](https://github.com/kristijorgji/js-devkit/commit/18636b0d320317ba3fb49b95a7cecdb7f768fcd0) Thanks [@kristijorgji](https://github.com/kristijorgji)! - When `explicitTypes` enables `explicit-function-return-type`, `createReactConfig` turns that rule off for `.tsx`/`.jsx` (JSX return types are inferred). Document the React-factory default and scrub private adopter names from public kit docs/comments/tests. Republishing react-config also floors the typescript-config dependency at the current workspace minor.

### Patch Changes

- Updated dependencies [[`18636b0`](https://github.com/kristijorgji/js-devkit/commit/18636b0d320317ba3fb49b95a7cecdb7f768fcd0)]:
  - @kristijorgji/eslint-config-typescript@1.2.1

## 2.0.0

### Major Changes

- [#23](https://github.com/kristijorgji/js-devkit/pull/23) [`983822b`](https://github.com/kristijorgji/js-devkit/commit/983822b33895cdb17f2d483f0bc6a19ea1970913) Thanks [@kristijorgji](https://github.com/kristijorgji)! - Remove `kj/jsx-leading-prop-order`. JSX prop order now comes from `perfectionist/sort-jsx-props` on `@kristijorgji/eslint-config-react-typescript` (new dependency + `jsxProps` / `createJsxPropsConfig`).

- [#23](https://github.com/kristijorgji/js-devkit/pull/23) [`983822b`](https://github.com/kristijorgji/js-devkit/commit/983822b33895cdb17f2d483f0bc6a19ea1970913) Thanks [@kristijorgji](https://github.com/kristijorgji)! - Add `importOrder`, `sortImports`, and `prettier: 'prettierrc'` options (plus `createImportOrderRules`) so consumers can match repo Prettier and import style without local rule overrides.

### Patch Changes

- Updated dependencies [[`983822b`](https://github.com/kristijorgji/js-devkit/commit/983822b33895cdb17f2d483f0bc6a19ea1970913), [`983822b`](https://github.com/kristijorgji/js-devkit/commit/983822b33895cdb17f2d483f0bc6a19ea1970913), [`983822b`](https://github.com/kristijorgji/js-devkit/commit/983822b33895cdb17f2d483f0bc6a19ea1970913)]:
  - @kristijorgji/eslint-plugin@0.2.0
  - @kristijorgji/eslint-config-typescript@1.1.0

## 1.0.0

### Major Changes

- [`a04b020`](https://github.com/kristijorgji/js-devkit/commit/a04b020863c5061d5cbfc1161d2edea2fe7f156c) Thanks [@kristijorgji](https://github.com/kristijorgji)! - Rewrite `@kristijorgji/eslint-config-react-typescript` as an ESM flat-config factory (`createReactConfig({ variant: 'vite' | 'next' })`) in the js-devkit monorepo. Drops the legacy `eslint-config-react-app` / ESLint 8 shareable-config lineage.

  **Migration (Vite + Storybook):**

  ```js
  import { createReactConfig } from "@kristijorgji/eslint-config-react-typescript";
  export default await createReactConfig({
    variant: "vite",
    tsconfigRootDir: import.meta.dirname,
    storybook: true,
  });
  ```

  **Migration (Next):** use `variant: 'next'` and install `eslint-plugin-react` + `@next/eslint-plugin-next`.

  Source reference: kristijorgji/eslint-config-react-typescript@8c090ded (rewritten, not ported).

### Patch Changes

- Updated dependencies [[`a04b020`](https://github.com/kristijorgji/js-devkit/commit/a04b020863c5061d5cbfc1161d2edea2fe7f156c)]:
  - @kristijorgji/eslint-config-typescript@1.0.0
