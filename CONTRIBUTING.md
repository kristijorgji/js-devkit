# Contributing to js-devkit

## Prerequisites

- Node.js `>= 22.16.0` (`.nvmrc`)
- pnpm `9.15.4`

```bash
pnpm install
pnpm build
pnpm test
pnpm lint
```

## Commit messages

Use [Conventional Commits](https://www.conventionalcommits.org/). Examples: `feat(eslint-plugin): …`, `fix(code-analysis): …`, `docs: …`, `chore: …`.

**Versioning is driven by Changesets, not by commit types.** Do not bolt on semantic-release — that would double-bump packages.

## Pull request checklist

- [ ] `pnpm build && pnpm test && pnpm lint` pass locally
- [ ] If you changed anything under `packages/**`, you added a changeset (`pnpm changeset`)
- [ ] For chore-only PRs with no package impact: `pnpm changeset --empty`
- [ ] New rules include `docs/rules/<name>.md` and tests
- [ ] Option types are exported when you add configurable APIs

CI enforces changesets on PRs that touch `packages/**` via `pnpm changeset status --since=origin/<base>`.

## Releasing (Changesets)

This monorepo publishes **multiple independent packages**. The old single-repo tag-push model (`v*` → `npm version` → `npm publish`) does not work here — a bare `v1.2.3` tag cannot say which package it versions.

### Developer-facing convention

Every PR that changes `packages/**` includes a changeset:

```bash
pnpm changeset
```

Pick the affected packages, a bump type (`patch` / `minor` / `major`), and write one human sentence. That produces `.changeset/<id>.md`, committed with the code.

### Two-phase release

1. **PR with code + changeset** merges to `main`.
2. `changesets/action` sees pending changesets and opens a **chore: version packages** PR (version bumps + CHANGELOGs + lockfile refresh via `pnpm ci:version`).
3. Merging that version PR runs `pnpm ci:publish` (`pnpm -r build && changeset publish`), which publishes only packages whose version is not already on the registry, creates `pkg@version` tags, and opens GitHub Releases.

Nothing publishes on the first merge. The version PR is the review gate; merging it is the act of releasing. A partially-failed publish is safe to re-run.

### Root scripts

| Script | Purpose |
| ------ | ------- |
| `pnpm changeset` | Create a changeset interactively |
| `pnpm ci:version` | `changeset version` then `pnpm install --lockfile-only` (required on pnpm so the version PR's lockfile matches bumped workspace deps) |
| `pnpm ci:publish` | Build all packages, then `changeset publish` |

### GitHub Actions

- [`.github/workflows/ci.yml`](.github/workflows/ci.yml) — build, test, lint, changeset status, plugin peer matrix (`eslint@9+ts5` / `eslint@10+ts6`)
- [`.github/workflows/release.yml`](.github/workflows/release.yml) — Changesets action on push to `main`

Maintainer one-time repo setup (Actions “create and approve PRs” toggle, npm Trusted Publishing, provenance): [docs/maintainer-release-setup.md](docs/maintainer-release-setup.md).

Publishes use **Trusted Publishing (OIDC)** from [`.github/workflows/release.yml`](.github/workflows/release.yml). Do **not** set `NPM_TOKEN` / `NODE_AUTH_TOKEN` on the Release job — a present token bypasses OIDC. The workflow upgrades npm to ≥ 11.5.1 and sets `permissions.id-token: write`.

Each package keeps `"publishConfig": { "access": "public", "provenance": true }`; under Trusted Publishing, provenance is also generated automatically.

Use the default `GITHUB_TOKEN` (not a PAT) for the release workflow so pushes from Actions do not re-trigger workflows; the human merge of the version PR is what starts publishing.

### Per-package manifest conventions

Every publishable package must include:

- `"publishConfig": { "access": "public", "provenance": true }`
- `"files": ["dist", "README.md", "LICENSE"]` (allow-list — no `.npmignore`)
- `"repository": { "type": "git", "url": "git+https://github.com/kristijorgji/js-devkit.git", "directory": "packages/<name>" }`
- `"type": "module"`, `"exports"`, `"types"`, `"engines": { "node": ">=22.16.0" }`, `"license": "MIT"`
- Its own `README.md` (renders on npm) and a Changesets-generated `CHANGELOG.md` (never hand-edit)

Internal deps use `workspace:^`; pnpm rewrites them to real semver at publish time.

### Pre-releases

```bash
pnpm changeset pre enter next   # publish under dist-tag `next`
# … iterate …
pnpm changeset pre exit         # before a real latest release
```

## Local linking

```bash
# in a consumer repo
pnpm add -D link:../js-devkit/packages/eslint-plugin
```

Always rebuild after edits. Before a real release, also verify with `pnpm pack` + install the `.tgz` so `files` / `exports` mistakes are caught.
