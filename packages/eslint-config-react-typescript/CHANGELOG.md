# @kristijorgji/eslint-config-react-typescript

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
