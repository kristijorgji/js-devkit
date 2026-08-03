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
  // Prefer your repo's .prettierrc as the single source of truth:
  prettier: 'prettierrc',
});
```

### Options

| Option | Description |
| --- | --- |
| `files` | Glob patterns (default `**/*.{ts,tsx}`) |
| `tsconfigRootDir` | Enables type-aware rules via `createTypedLintConfig` |
| `prettier` | `true` (default, embeds package defaults), `'prettierrc'` (defer to the consumer's Prettier config file), a Prettier options object (replaces defaults), or `false` |
| `ignores` | Extra ignore globs |
| `importOrder` | Options for `import-x/order`, shallow-merged over package defaults; `false` disables the rule |
| `sortImports` | Options for `sort-imports`, shallow-merged over package defaults; `false` disables the rule |

### Named exports / subpaths

- `@kristijorgji/eslint-config-typescript` — factory + all named parts
- `./base` — `createBaseConfig` / `baseRules`
- `./typed` — `createTypedLintConfig`
- `./ignores` — default ignore block

Also exported: `createImportOrderRules`, `importOrderRules`,
`defaultImportXOrderOptions`, `defaultSortImportsOptions`.

### Plugin rule placement

This package enables **`kj/no-pure-type-alias` only**. JSX prop order
(`perfectionist/sort-jsx-props`), single-export barrels, and component extraction
live in `@kristijorgji/eslint-config-react-typescript`.

Vendored from [`eslint-config-typescript@702410cb`](https://github.com/kristijorgji/eslint-config-typescript/commit/702410cb03fb6f506d148cde7aa94d8a844d3621) and rewritten as an ESM flat-config factory.
