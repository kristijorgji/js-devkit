# Release 2: folding in the two config packages (deferred)

Executable checklist for a later agent. Do **not** start until the preconditions below are met.

**Goal:** publish `@kristijorgji/eslint-config-typescript@1.0.0` and `@kristijorgji/eslint-config-react-typescript@1.0.0` from this monorepo, keeping the existing npm names, both flat-config, both built on `@kristijorgji/eslint-plugin`.

**Do not start until:**

- `@kristijorgji/eslint-plugin` and `@kristijorgji/code-analysis` are published at `>= 0.1.0`
- both `react_ts_vite_tailwind_sb` and prona365 are migrated onto those packages and green
- you have written down what each consumer's local `eslint.config` still contains after that migration (that list is the input to step 4)

## Step 1 — Vendor the sources

- Copy `~/Desktop/libs/eslint-config-typescript/index.cjs` into `packages/eslint-config-typescript/src/`, split into modules (`base.ts`, `import-order.ts`, `prettier.ts`, `ignores.ts`) rather than one file. Copy `__tests__/config.test.ts` and `__tests__/data/fixtures/` to `tests/`.
- Read `~/Desktop/libs/eslint-config-react-typescript/index.js` for reference only. It is an ESLint 8 eslintrc object extending `react-app`; it gets rewritten in step 5, not ported.
- Do not try to preserve git history — the repos have 8 and 2 commits. Plain copy, and record the source commit SHAs in the initial changeset summary for traceability.

## Step 2 — Version continuity (easiest thing to get wrong)

`packages/eslint-config-typescript/package.json` must start at **`0.0.3`** and `packages/eslint-config-react-typescript/package.json` at **`0.0.1`**, matching what is live on npm. Starting either at `0.0.0` makes `changeset publish` either attempt an already-taken version and fail, or skip the package silently. A `major` changeset then carries them to `1.0.0`.

Confirm the live versions first with `npm view @kristijorgji/eslint-config-typescript versions` — note that the published set is `0.0.1, 0.0.3`, because the `v0.0.2` git tag never resulted in a publish.

## Step 3 — Fix the dependency model in `eslint-config-typescript`

- Move `eslint`, `typescript` and `prettier` out of `dependencies` into `peerDependencies`: `eslint: ^9 || ^10`, `typescript: ^5 || ^6`, `prettier: ^3`. Shipping `eslint` as a hard dependency is the current bug — it gives consumers a second ESLint install.
- **Keep** the ESLint plugins (`@typescript-eslint/*`, the import plugin, `eslint-plugin-prettier`, `eslint-config-prettier`, `globals`) as real `dependencies`. Under flat config the shared config imports them directly, so bundling them is correct and spares consumers from installing each one by hand. This inverts the eslintrc-era advice, and it is what prona365's `@repo/eslint-config` already does.
- Add `@kristijorgji/eslint-plugin: workspace:^`.
- Drop `eslint-config-standard` — it is eslintrc-only and does nothing under flat config.
- Decide on the import plugin: the published config uses legacy `eslint-plugin-import` plus `eslint-import-resolver-typescript`, while both consumers use `eslint-plugin-import-x`. Migrate to `import-x` (it carries its own resolver, so the separate resolver dep goes away). This is part of what makes the release a major.
- Add `exports`, `files`, `repository.directory`, `engines`, `type: module`; delete `main: index.cjs` and the `.npmignore`.

## Step 4 — Convert it to a factory

- Public API `createTypescriptConfig({ files?, tsconfigRootDir?, prettier?, ignores? })` returning a flat config array, plus named exports for the constituent parts (`baseRules`, `importOrderRules`, `prettierConfig`, `ignores`) so a consumer can compose instead of having to accept the whole thing. This mirrors `createEslintConfig()` in prona365's `packages/eslint-config/package.js`, which is the API that has already survived contact with six apps.
- Entry points via `exports`: `.` (the factory), `./base`, `./typed`, `./ignores`.
- Move prona365's `createTypedLintConfig(tsconfigRootDir)` here — the type-aware block is TypeScript-generic, not React-specific.
- The factory enables the plugin's `recommended` config internally, so taking the config gets you the custom rules.

## Step 5 — Rewrite `eslint-config-react-typescript` as flat config

Delete the `react-app` lineage entirely; `eslint-config-react-app` is CRA-era and drags in Babel and Jest plugins neither consumer wants.

`createReactConfig({ variant: 'vite' | 'next', tsconfigRootDir, storybook?, a11y? })`:

- Shared core: `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, JSX rules, plus the plugin's `kj/no-multi-comp`, `kj/jsx-leading-prop-order` and the warn-only `componentExtraction` set.
- `variant: 'next'` adds `@next/eslint-plugin-next` and `eslint-plugin-react` (prona365's stack).
- `variant: 'vite'` adds `eslint-plugin-react-x` and `eslint-plugin-react-dom`, plus `eslint-plugin-storybook` when `storybook: true` (this repo's stack).
- The design detail that makes two variants work in one package: declare the framework-specific plugins as `peerDependencies` with `peerDependenciesMeta: { "<plugin>": { "optional": true } }`, and `await import()` them inside the variant branch. A Vite consumer then never has to install the Next plugin, and vice versa.
- Depends on `@kristijorgji/eslint-config-typescript: workspace:^`.

## Step 6 — Leave translations in the consumers

`react_ts_vite_tailwind_sb` uses `eslint-plugin-formatjs`; prona365 uses `eslint-plugin-i18next`. Do not unify these in release 2. Leave both blocks local to their repos until a third project forces the question — a shared abstraction over two different plugins with two different rule sets, serving two consumers, is not worth it yet.

## Step 7 — Tests

- Keep the existing snapshot approach (lint a fixture, compare full lint output against `expected.json`) but run it on Vitest instead of Jest, and import `ESLint` from `eslint` rather than `FlatESLint` from `eslint/use-at-your-own-risk`. That internal path is exactly what breaks on a new ESLint major, and the config now claims `^9 || ^10`.
- One fixture directory per surface: `tests/fixtures/{base,vite,next}`, each with its own tsconfig, asserting which rule IDs fire.
- Extend the CI compatibility matrix to cover these two packages.

## Step 8 — Publish and migrate the consumers

- Two `major` changesets, one per package, with the migration notes written into the summary — that text becomes both the CHANGELOG entry and the GitHub release body.
- `react_ts_vite_tailwind_sb` moves to `createReactConfig({ variant: 'vite', storybook: true })` with the formatjs block staying local. `eslint.config.js` should drop from 266 lines to well under 100; that reduction is the acceptance criterion.
- prona365's `packages/eslint-config` becomes a thin wrapper over `createReactConfig({ variant: 'next' })` plus its repo-specific pieces (`api-client-rules.js`, the `no-barrels.js` wiring, domain-glossary rules), which stay private.
- Anything left in prona365's config that turns out to be genuinely generic — `zInferOutsideTypesRule` is the likely candidate — gets promoted into the plugin as a follow-up, not folded into this release.

## Step 9 — Decommission the old repos

Delete `.github/workflows/publish.yaml` in both old repos **before** archiving, so a stray tag push can never publish over the monorepo's releases. Add a README pointing at js-devkit, then archive on GitHub. The npm packages themselves need no deprecation, since the names carry over.
