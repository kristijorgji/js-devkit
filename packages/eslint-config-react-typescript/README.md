# @kristijorgji/eslint-config-react-typescript

Flat ESLint config factory for React + TypeScript apps. Builds on
[`@kristijorgji/eslint-config-typescript`](https://www.npmjs.com/package/@kristijorgji/eslint-config-typescript)
with `variant: 'vite' | 'next'`.

## Install

```bash
# Vite + Storybook example
pnpm add -D @kristijorgji/eslint-config-react-typescript \
  eslint typescript prettier \
  eslint-plugin-react-x eslint-plugin-react-dom eslint-plugin-storybook

# Next example
pnpm add -D @kristijorgji/eslint-config-react-typescript \
  eslint typescript prettier \
  eslint-plugin-react @next/eslint-plugin-next
```

Framework plugins are **optional peers** — only install what your variant needs.
`eslint-plugin-perfectionist` is a **dependency** of this package (JSX prop order).

## Usage

```js
// eslint.config.js
import { createReactConfig } from '@kristijorgji/eslint-config-react-typescript';

export default await createReactConfig({
  variant: 'vite',
  tsconfigRootDir: import.meta.dirname,
  storybook: true,
  prettier: 'prettierrc',
});
```

### Options

| Option | Description |
| --- | --- |
| `variant` | `'vite'` or `'next'` (required) |
| `tsconfigRootDir` | Required for type-aware rules |
| `storybook` | Vite only — Storybook flat recommended |
| `a11y` | Optional `eslint-plugin-jsx-a11y` |
| `jsxProps` | Options for `perfectionist/sort-jsx-props` (shallow merge); `false` disables |
| plus | All `createTypescriptConfig` options (`prettier`, `importOrder`, `sortImports`, …) |

### Shared React rules

- `eslint-plugin-react-hooks` / `react-refresh`
- `perfectionist/sort-jsx-props` (ranked identity props, then unknown, callbacks last)
- `kj/no-single-export-barrel`
- `componentExtraction()` (`kj/no-multi-comp` + line limits, warn)

### Standalone JSX prop config

Consumers with a custom React preset (for example React Native) can compose without
the full factory:

```js
import { createJsxPropsConfig } from '@kristijorgji/eslint-config-react-typescript';

export default [
  createJsxPropsConfig(),
];
```

Rewritten from the legacy `eslint-config-react-app` shareable config
([`8c090ded`](https://github.com/kristijorgji/eslint-config-react-typescript/commit/8c090ded195c4c957cee7e24b3b5b024ad6120f9)) — not a port of that lineage.
