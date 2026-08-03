# @kristijorgji/eslint-config-react-typescript

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
