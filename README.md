# js-devkit

Shared ESLint rules and code-analysis tooling for TypeScript/JavaScript projects, published as scoped npm packages under `@kristijorgji/*`.

## Table of contents

- [Packages](#packages)
- [Requirements](#requirements)
- [Quick start](#quick-start)
- [Repository layout](#repository-layout)
- [Development](#development)
- [Adding a new rule](#adding-a-new-rule)
- [Adding a new analyzer](#adding-a-new-analyzer)
- [Releasing](#releasing)
- [Compatibility and support](#compatibility-and-support)
- [Roadmap](#roadmap)
- [License](#license)

## Packages

| Package | Purpose | Docs |
| ------- | ------- | ---- |
| [`@kristijorgji/eslint-plugin`](https://www.npmjs.com/package/@kristijorgji/eslint-plugin) | Custom ESLint rules under the `kj` namespace, plus config factories and `no-restricted-syntax` selector composers | [packages/eslint-plugin/README.md](packages/eslint-plugin/README.md) |
| [`@kristijorgji/code-analysis`](https://www.npmjs.com/package/@kristijorgji/code-analysis) | `kj-analyze` CLI — test-mock duplication analysis and more | [packages/code-analysis/README.md](packages/code-analysis/README.md) |

## Requirements

- **Node.js** `>= 22.16.0` (see [`.nvmrc`](.nvmrc))
- **pnpm** `9.15.4` (pinned via `packageManager`)
- For `@kristijorgji/eslint-plugin` peers:
  - `eslint` `^9 \|\| ^10`
  - `typescript` `^5 \|\| ^6`

CI verifies the plugin against both `eslint@9 + typescript@5` and `eslint@10 + typescript@6`.

## Quick start

### ESLint plugin

```bash
pnpm add -D @kristijorgji/eslint-plugin
```

```js
// eslint.config.js
import kjPlugin, {
  recommended,
  componentExtraction,
  objectLiteralTypingSelectors,
  mockBodySatisfiesSelectors,
  restrictedSyntaxRuleEntry,
} from '@kristijorgji/eslint-plugin';

export default [
  ...recommended(),
  ...componentExtraction(),
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': restrictedSyntaxRuleEntry([
        objectLiteralTypingSelectors,
        mockBodySatisfiesSelectors,
      ]),
    },
  },
];
```

Full usage, options, and migration notes: [packages/eslint-plugin/README.md](packages/eslint-plugin/README.md).

### Code analysis CLI

```bash
pnpm add -D @kristijorgji/code-analysis
pnpm exec kj-analyze test-mocks
```

Full flags, config file, and programmatic API: [packages/code-analysis/README.md](packages/code-analysis/README.md).

## Repository layout

```
js-devkit/
├── packages/
│   ├── eslint-plugin/     # @kristijorgji/eslint-plugin
│   └── code-analysis/     # @kristijorgji/code-analysis
├── docs/
│   ├── rules/             # Per-rule docs (linked from RuleCreator URLs)
│   ├── maintainer-release-setup.md  # One-time Actions + NPM_TOKEN checklist
│   └── release-2-eslint-configs.md
├── .changeset/            # Changesets config + pending changesets
├── .github/workflows/     # CI + release
├── CONTRIBUTING.md
└── README.md
```

No Turborepo yet — `pnpm -r build` / `pnpm -r test` is enough at this size. Conventional per-package scripts (`build`, `test`, `lint`, `typecheck`) keep a later Turbo migration cheap.

## Development

```bash
git clone git@github.com:kristijorgji/js-devkit.git
cd js-devkit
pnpm install
pnpm build
pnpm test
pnpm lint
```

### Try a change against a real consumer before publishing

From a consumer repo (for example `react_ts_vite_tailwind_sb`):

```bash
pnpm add -D link:../js-devkit/packages/eslint-plugin
pnpm add -D link:../js-devkit/packages/code-analysis
```

Rebuild the package after edits (`pnpm --filter @kristijorgji/eslint-plugin build`). A `link:` install does **not** exercise the published `files` / `exports` surface — before a real release, also smoke-test with a tarball:

```bash
cd packages/eslint-plugin && pnpm pack
# then in the consumer:
pnpm add -D /absolute/path/to/kristijorgji-eslint-plugin-0.1.0.tgz
```

## Adding a new rule

1. Add `packages/eslint-plugin/src/rules/<name>.ts` with a `meta.schema` for any options.
2. Write `docs/rules/<name>.md` (rationale, correct/incorrect examples, options, when to disable). The `RuleCreator` docs URL points here.
3. Add a Vitest / `@typescript-eslint/rule-tester` test under `packages/eslint-plugin/tests/`.
4. Register the rule in `src/plugin.ts`.
5. Decide whether it joins `recommended()`, `componentExtraction()`, or stays opt-in.
6. Export any option types from `src/index.ts`.
7. Run `pnpm changeset` and pick a bump for `@kristijorgji/eslint-plugin`.

## Adding a new analyzer

1. Add `packages/code-analysis/src/analyzers/<name>/` with a pure analyze function and a formatter.
2. Add `packages/code-analysis/src/commands/<name>.ts`.
3. Wire the subcommand in `src/cli.ts`.
4. Export the public API from `src/index.ts` so it is usable programmatically, not only via CLI.
5. Add tests and document flags / config keys in the package README.
6. Run `pnpm changeset`.

## Releasing

1. Every PR that touches `packages/**` includes a changeset (`pnpm changeset`). Chore-only PRs use `pnpm changeset --empty`.
2. Merging to `main` opens a **chore: version packages** PR (bumps + CHANGELOGs).
3. Merging that version PR publishes to npm and creates git tags / GitHub Releases.

Details, conventions, and GitHub Actions setup: [CONTRIBUTING.md](CONTRIBUTING.md).

## Compatibility and support

| Package | Supported peers |
| ------- | --------------- |
| `@kristijorgji/eslint-plugin` | `eslint` ^9 \|\| ^10, `typescript` ^5 \|\| ^6 |
| `@kristijorgji/code-analysis` | Node >= 22.16.0 (no ESLint peer) |

Dropping a supported major is a **major** bump of the affected package. Packages version independently (Changesets `linked: []`).

## Roadmap

Release 2 will fold the existing `@kristijorgji/eslint-config-typescript` and `@kristijorgji/eslint-config-react-typescript` packages into this monorepo as flat-config factories built on `@kristijorgji/eslint-plugin`. See [docs/release-2-eslint-configs.md](docs/release-2-eslint-configs.md).

## License

[MIT](LICENSE)
