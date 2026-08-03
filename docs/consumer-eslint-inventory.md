# Consumer ESLint inventory (post–plugin migration, pre–R2 factories)

Input for [release-2-eslint-configs.md](./release-2-eslint-configs.md) step 4 / step 8.
Snapshot of what each consumer still owns locally after migrating onto `@kristijorgji/eslint-plugin`, and what `createTypescriptConfig` / `createReactConfig` should absorb vs leave behind.

**Factory boundaries (from R2 plan):**

| Factory | Absorbs |
| --- | --- |
| `createTypescriptConfig` | Flat TS base (import-x, unused-imports, sonarjs in-file dup, explicit typing, prettier), `recommended()` / typed weak-typeof, `createTypedLintConfig`, shared ignores / named part exports |
| `createReactConfig({ variant: 'vite' })` | TS factory + react-hooks, react-refresh, react-x, react-dom, optional storybook, `componentExtraction`, `kj/jsx-leading-prop-order` (and related JSX/react shared core) |
| `createReactConfig({ variant: 'next' })` | TS factory + `eslint-plugin-react`, `@next/eslint-plugin-next`, react-hooks, react-refresh, `componentExtraction`, `kj/jsx-leading-prop-order` |

**Explicitly not unified in R2:** translations/i18n plugins (formatjs vs i18next), monorepo domain rules, api-client selectors, barrel package wiring.

---

## 1. `react_ts_vite_tailwind_sb`

**Path:** `/Users/kristi.jorgji/Desktop/libs/react_ts_vite_tailwind_sb`

### Link vs published

| Package | Resolution |
| --- | --- |
| `@kristijorgji/eslint-plugin` | npm `^0.1.1` (was `link:` during migration) |
| `@kristijorgji/code-analysis` | npm `^0.1.1` (knip/analyze, not ESLint config) |
| `@kristijorgji/eslint-config-react-typescript` | npm `^1.0.0` via `createReactConfig({ variant: 'vite' })` |
| `@kristijorgji/eslint-config-typescript` | pulled in by the react factory |

### Current entrypoints

- `eslint.config.js` (~272 lines) — hand-rolled flat config
- `eslint.translations.config.js` — formatjs literal-string block

### ESLint-related `package.json` deps (consumer-owned today)

Direct: `eslint`, `@eslint/js`, `typescript-eslint`, `eslint-config-prettier`, `eslint-plugin-prettier`, `eslint-plugin-import-x`, `eslint-import-resolver-typescript`, `eslint-plugin-unused-imports`, `eslint-plugin-sonarjs`, `eslint-plugin-formatjs`, `eslint-plugin-react-x`, `eslint-plugin-react-dom`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `eslint-plugin-storybook`, `eslint-plugin-perfectionist`, `globals`, `prettier` (+ `prettier-plugin-tailwindcss`).

After R2, most of these move into factory package `dependencies` / optional peers; consumer keeps formatjs (+ perfectionist if it stays local).

### Absorbed by factories after R2

| Block in `eslint.config.js` today | Target |
| --- | --- |
| Ignores (`dist`, `coverage`, `storybook-static`, `reports`, `!.storybook`) | TS / React factory `ignores` (+ consumer extras) |
| `...recommended()` | Inside `createTypescriptConfig` |
| `...typed({ tsconfigRootDir })` | TS factory (`./typed` / `createTypedLintConfig` move) |
| Main TS block: `@eslint/js` + `tseslint.recommended`, import-x order/first/duplicates, unused-imports, sonarjs identical-*, consistent-type-*, explicit-*, prettier | `createTypescriptConfig` |
| Object-literal `: Type` + test/story `satisfies` `no-restricted-syntax` blocks | TS factory (same selectors from plugin) |
| `@typescript-eslint/explicit-function-return-type` off for `**/*.tsx` | `createReactConfig` |
| react-hooks, react-refresh, react-x, react-dom | `createReactConfig({ variant: 'vite' })` |
| `...storybook.configs['flat/recommended']` (+ local `storybook/no-renderer-packages` off) | `createReactConfig({ storybook: true })` (severity may stay as tiny local override) |
| `...componentExtraction({ hookFiles, ignores })` | React factory (options still overridable locally if needed) |

### Stays local (NOT covered by factories)

| Local ownership | Notes |
| --- | --- |
| **`eslint.translations.config.js` + `eslint-plugin-formatjs`** | R2 step 6 — keep formatjs here; do not share with prona’s i18next |
| **`perfectionist/sort-jsx-props`** | Vite consumer’s JSX prop-order solution; turns **`kj/jsx-leading-prop-order` off** in the same repo |
| **`no-console`** on `src/**/*` (`allow: ['warn','error']`) | App policy, not shared |
| **import-x `pathGroups`** (`react` before external, `@/**`, `@test/**`) | Alias-specific; base factory can ship plain groups only |
| **`react-x/component-hook-factories`: off** for tests/mocks | Test harness override |
| **`@typescript-eslint/ban-ts-comment`: off** | Local leniency |
| **Storybook rule tweak** `storybook/no-renderer-packages: off` | Optional local override after factory storybook preset |
| **componentExtraction `hookFiles`** (`**/use*.ts`, `src/c/hooks/**`) | Pass as factory options or keep as appended `configs` |

Target shape after R2: `createReactConfig({ variant: 'vite', storybook: true, … })` + formatjs block + thin local overrides; acceptance: `eslint.config.js` well under ~100 lines.

---

## 2. `prona365-js-devkit` → `@repo/eslint-config`

**Path:** `/Users/kristi.jorgji/Desktop/test/kristi/prona365-workspace/prona365-js-devkit/packages/eslint-config`

### Link vs published

| Package | Resolution |
| --- | --- |
| `@kristijorgji/eslint-plugin` | npm `^0.1.1` (via `@repo/eslint-config`) |
| `@kristijorgji/code-analysis` | npm `^0.1.1` at workspace root (analyzer) |
| `@kristijorgji/eslint-config-typescript` / `…-react-typescript` | npm `^1.0.0` via `@repo/eslint-config` factories |
| Workspace consumers | `@repo/eslint-config`: `workspace:*` |

### Module map

| File | Role today |
| --- | --- |
| `package.js` | `createEslintConfig({ importMetaUrl, preset, ignores, configs })` — R2 becomes thin wrapper over shared factories |
| `base.js` | TS strict/stylistic + import-x/sonarjs/unused + typing selectors + monorepo carve-outs |
| `typed.js` | `createTypedLintConfig` → moves into TS factory |
| `react.js` | Next + react + hooks/refresh + componentExtraction + api-client + (uncommitted) JSX/barrel kj rules |
| `react-native.js` | RN/Expo react + hooks + same extraction/api-client/(uncommitted) kj split — **no R2 `variant: 'react-native'`** |
| `translations.js` | `eslint-plugin-i18next` |
| `i18n-client-boundary.js` | Restrict `@repo/i18n/email` / `admin` + locale JSON patterns |
| `no-barrels.js` | `kj/no-barrel` wired for `@repo/utils|query|ui` |
| `api-client-rules.js` | API generics, `invalidateQueries`, testid literals, mutation return style |

### Uncommitted parity fix (`recommended()` split)

Working tree (not committed): stop spreading `...recommended()` in `base.js`.

- **`base.js`:** only `kj/no-pure-type-alias` (via `plugin`)
- **`react.js` / `react-native.js`:** add `kj/jsx-leading-prop-order` (all `**/*.{ts,tsx}`) and `kj/no-single-export-barrel` scoped to `**/apps/**/src/**/index.{ts,tsx}` + `**/packages/ui/src/**/index.ts`

Matches pre-migration preset boundaries; R2 React factory should enable leading-prop (+ single-export barrel only if still desired for Next monorepo — today scoped paths are prona-specific, so prefer **keeping `no-single-export-barrel` local** unless the factory accepts a `files` option).

### Absorbed by factories after R2

| Current `@repo/eslint-config` piece | Target |
| --- | --- |
| Most of `base.js` rule body (unused, import-x, sonarjs, consistent-/explicit-*, prettier) | `createTypescriptConfig` |
| Object-literal + mock `satisfies` selector blocks (generic part) | TS factory |
| `typed.js` / `createTypedLintConfig` | TS factory |
| `react.js`: `eslint-plugin-react`, `@next/eslint-plugin-next`, hooks, refresh, tsx return-type off, `componentExtraction`, `kj/jsx-leading-prop-order` | `createReactConfig({ variant: 'next' })` |
| Shared ignores that are generic (`node_modules`, `dist`, `coverage`, `storybook-static`, …) | Factory ignores |

### Stays local in `@repo/eslint-config` (NOT covered by factories)

| Local ownership | Notes |
| --- | --- |
| **`translations.js`** (`eslint-plugin-i18next`) | R2 step 6 — keep; different plugin than vite consumer |
| **`i18n-client-boundary.js`** | `@repo/i18n` package boundaries |
| **`no-barrels.js`** (`utilsBarrelRules` / `queryBarrelRules` / `uiBarrelRules`) | `@repo/*` package names + ignore paths |
| **`api-client-rules.js`** | Entire module: restricted `ApiSuccessResponse`, inline `api.*` generics, `invalidateQueries`, literal testids → `@repo/testids`, mutation `res/response` pattern; re-stacks `no-restricted-syntax` with base selectors |
| **`zInferOutsideTypesRule`** (+ types-package / eslint-config ignores) | Prona `@repo/types` domain; R2: keep private; promote to plugin later if generic |
| **Monorepo path carve-outs** | `packages/eslint-config/**`, `packages/types/**`, Maestro scripts, `*.config.{js,mjs,cjs}`, etc. |
| **`kj/no-single-export-barrel` file scope** | Apps + `packages/ui` index barrels only |
| **`react-native.js` preset** | R2 factories are `vite` \| `next` only — RN stays a local preset composed from TS factory + RN plugins |
| **`createEslintConfig` wrapper** | Continues as ergonomic monorepo API (`preset`, `configs[]`) over shared factories |

### Stays local in **app/package** `eslint.config.*` (domain / product rules)

These are outside `@repo/eslint-config` modules but also **not** factory material:

| Consumer | Examples |
| --- | --- |
| `apps/web` | SW import bans, `no-console`, scripts import ban, App Router refresh off, locale/`i18n.language` / `useLocale` guards, story/test relaxations |
| `apps/mobile` | translations + i18n boundary + barrels + `no-console` + RN ignores |
| `apps/admin` | translations + barrels + admin i18n import matrix |
| `apps/backend` / `crawler` | barrels + console / test overrides |
| `apps/web-e2e` | ban Playwright `getByText` / `getByAltText` (testid-only) |
| packages (`ui`, `query`, …) | selective `apiClientRules` / barrel exports via `createEslintConfig` |

Release-2 wording “domain-glossary rules” maps to these app-level restricted-import / locale / SW / e2e selectors (no separate `glossary` module in tree today).

---

## 3. Side-by-side: stays local vs shared

| Concern | `react_ts_vite_tailwind_sb` | prona `@repo/eslint-config` (+ apps) | R2 shared factory? |
| --- | --- | --- | --- |
| TS base + prettier + import-x + sonarjs + explicit typing | local today → factory | `base.js` → factory | **Yes** (`createTypescriptConfig`) |
| Plugin `recommended` / typed | already via plugin | split base vs react (uncommitted) | **Yes** (typed + pure-type-alias in TS; leading-prop in React) |
| Vite react-x / react-dom / Storybook | local | — | **Yes** (`variant: 'vite'`, `storybook`) |
| Next + `eslint-plugin-react` | — | `react.js` | **Yes** (`variant: 'next'`) |
| React Native | — | `react-native.js` | **No** (local preset) |
| Translations | formatjs file | i18next module | **No** |
| i18n package boundaries | — | `i18n-client-boundary.js` | **No** |
| Workspace `kj/no-barrel` wiring | — | `no-barrels.js` | **No** |
| API client / testid / query mutation selectors | — | `api-client-rules.js` | **No** |
| `z.infer` outside `@repo/types` | — | `base.js` | **No** (later plugin candidate) |
| Perfectionist JSX props | yes (disables kj leading-prop) | uses `kj/jsx-leading-prop-order` | **No** (vite-local) |
| App domain (`no-console`, SW, locale, e2e) | `no-console` only | many app configs | **No** |

---

## 4. Dep / link checklist for R2 migration notes

1. Packages are on npm: plugin / code-analysis ≥ `0.1.1`, eslint-config-* at `1.0.0`. Consumers should use registry ranges, not `link:`.
2. Factories ship via `@kristijorgji/eslint-config-typescript` / `@kristijorgji/eslint-config-react-typescript`; `@repo/eslint-config` (prona) and sb wrap them.
3. Prona peer range still `eslint: ^9` while vite consumer is on **ESLint 10** — factory peers are `^9 || ^10`.
4. After factories land: drop duplicate plugin deps from consumer `package.json` where the factory bundles them; keep formatjs / i18next / Next-or-Vite optional peers per variant.
