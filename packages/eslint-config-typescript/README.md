# @kristijorgji/eslint-config-typescript

Flat ESLint config factory for TypeScript projects, built on
[`@kristijorgji/eslint-plugin`](https://www.npmjs.com/package/@kristijorgji/eslint-plugin).

## Install

```bash
pnpm add -D @kristijorgji/eslint-config-typescript eslint typescript prettier
```

## Usage

```js
// eslint.config.js
import { createTypescriptConfig } from '@kristijorgji/eslint-config-typescript';

export default createTypescriptConfig({
  tsconfigRootDir: import.meta.dirname,
});
```

### Options

| Option | Description |
| --- | --- |
| `files` | Glob patterns (default `**/*.{ts,tsx}`) |
| `tsconfigRootDir` | Enables type-aware rules via `createTypedLintConfig` |
| `prettier` | `true` (default), `false`, or Prettier options object |
| `ignores` | Extra ignore globs |

### Named exports / subpaths

- `@kristijorgji/eslint-config-typescript` — factory + all named parts
- `./base` — `createBaseConfig` / `baseRules`
- `./typed` — `createTypedLintConfig`
- `./ignores` — default ignore block

### Plugin rule placement

This package enables **`kj/no-pure-type-alias` only**. JSX leading-prop order,
single-export barrels, and component extraction live in
`@kristijorgji/eslint-config-react-typescript`.

Vendored from [`eslint-config-typescript@702410cb`](https://github.com/kristijorgji/eslint-config-typescript/commit/702410cb03fb6f506d148cde7aa94d8a844d3621) and rewritten as an ESM flat-config factory.
