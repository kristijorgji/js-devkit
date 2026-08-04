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
  // Opt into shared consumer policies (default off):
  codeQuality: true,
  explicitTypes: true,
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
| `codeQuality` | Opt-in (`true` or `{ duplication?, unusedSymbols? }`). Enables the sonarjs in-file duplication subset, `unused-imports/no-unused-imports`, and `@typescript-eslint/no-unused-private-class-members`. Default off. |
| `explicitTypes` | Opt-in (`true` or per-rule toggles). Enables `consistent-type-assertions`, `consistent-type-imports`, `explicit-module-boundary-types`, and `explicit-function-return-type` with the option objects shared by existing consumers. Default off. Pass `functionReturnType: false` when you disable return types on `.tsx` via a local override. |

### Migration from hand-rolled configs

If you previously enabled sonarjs duplication rules, `unused-imports`, and the
`@typescript-eslint` explicit/consistent typing rules locally, replace that
block with `codeQuality: true` and `explicitTypes: true`. For presets that do
not go through this factory (for example React Native), compose the standalone
blocks:

```js
import {
  createCodeQualityConfig,
  createExplicitTypesConfig,
} from '@kristijorgji/eslint-config-typescript';

export default [
  createCodeQualityConfig(),
  createExplicitTypesConfig(),
  // local .tsx override:
  {
    files: ['**/*.{tsx,jsx}'],
    rules: { '@typescript-eslint/explicit-function-return-type': 'off' },
  },
];
```

### Named exports / subpaths

- `@kristijorgji/eslint-config-typescript` — factory + all named parts
- `./base` — `createBaseConfig` / `baseRules`
- `./typed` — `createTypedLintConfig`
- `./ignores` — default ignore block

Also exported: `createImportOrderRules`, `importOrderRules`,
`defaultImportXOrderOptions`, `defaultSortImportsOptions`,
`createCodeQualityConfig`, `createExplicitTypesConfig`.

### Plugin rule placement

This package enables **`kj/no-pure-type-alias` only** from the plugin set
(plus optional `codeQuality` / `explicitTypes` groups above). JSX prop order
(`perfectionist/sort-jsx-props`), single-export barrels, and component extraction
live in `@kristijorgji/eslint-config-react-typescript`.

### Rule inventory snapshots

`tests/rule-inventory.test.ts` snapshots the sorted enabled rule IDs (grouped by
plugin prefix) for the default factory and for `codeQuality` + `explicitTypes`
on. Failures on upstream plugin bumps are an **intentional review gate** —
update the snapshot only after confirming the new rules are wanted.

Vendored from [`eslint-config-typescript@702410cb`](https://github.com/kristijorgji/eslint-config-typescript/commit/702410cb03fb6f506d148cde7aa94d8a844d3621) and rewritten as an ESM flat-config factory.
