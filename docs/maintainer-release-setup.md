# Maintainer release setup (one-time)

Maintainer-only checklist for [kristijorgji/js-devkit](https://github.com/kristijorgji/js-devkit). Casual contributors do not need this — see [CONTRIBUTING.md](../CONTRIBUTING.md) for the day-to-day Changesets flow.

## GitHub Actions: allow version PRs

The Release workflow uses [`changesets/action`](https://github.com/changesets/action) with the default `GITHUB_TOKEN`. That token can only open the **chore: version packages** PR if the repo allows it:

**Settings → Actions → General → Workflow permissions → enable “Allow GitHub Actions to create and approve pull requests”.**

Also set **default workflow permissions** to **Read and write** (or keep Read and rely on the workflow’s explicit `permissions:` block in [`.github/workflows/release.yml`](../.github/workflows/release.yml)).

### Failure symptom

```text
HttpError: GitHub Actions is not permitted to create or approve pull requests.
```

The version branch may still be force-pushed (`changeset-release/main`) while PR creation fails. Enabling the toggle above and re-running **Release** fixes it.

Via API (admin):

```bash
gh api -X PUT repos/kristijorgji/js-devkit/actions/permissions/workflow \
  -f default_workflow_permissions=write \
  -F can_approve_pull_request_reviews=true
```

## npm: Trusted Publishing (primary)

Publishes from CI use [npm Trusted Publishing](https://docs.npmjs.com/trusted-publishers/) (OIDC). There is **no** long-lived publish `NPM_TOKEN` in GitHub Actions.

### Per-package setup (npmjs.com)

For each publishable package (`@kristijorgji/eslint-plugin`, `@kristijorgji/code-analysis`, `@kristijorgji/eslint-config-typescript`, `@kristijorgji/eslint-config-react-typescript`):

1. Package → **Settings → Trusted Publisher → GitHub Actions**
2. Organization or user: `kristijorgji`
3. Repository: `js-devkit`
4. Workflow filename: `release.yml` (filename only, including `.yml`)
5. Environment: leave empty unless the Release job uses a GitHub Environment
6. Allowed actions: include **npm publish**

Brand-new package names must exist on the registry (a first local or token publish) before Trusted Publisher UI is available.

### Required workflow bits

[`.github/workflows/release.yml`](../.github/workflows/release.yml) must:

- Run on a **GitHub-hosted** runner (`ubuntu-latest`)
- Set `permissions.id-token: write` (OIDC)
- Use **npm ≥ 11.5.1** (Release installs `npm@11` globally; Node from `.nvmrc` is ≥ 22.14). Do not use `npm@latest` while it resolves to npm 12+, which requires Node `^22.22.2` / `^24.15` — newer than this repo’s `.nvmrc`.
- **Not** set `NODE_AUTH_TOKEN` / `NPM_TOKEN` on the publish job — a present (even invalid) token bypasses OIDC and breaks Trusted Publishing

`setup-node` may still set `registry-url: https://registry.npmjs.org`. Provenance is automatic under Trusted Publishing; packages also keep `"publishConfig": { "access": "public", "provenance": true }`.

### After Trusted Publishing works

On each package: **Settings → Publishing access → Require two-factor authentication and disallow tokens**. That blocks classic/granular write tokens while OIDC continues to work. Do this only after a successful CI publish under Trusted Publishing.

Revoke any leftover Automation / granular publish tokens in your npm account.

## npm: `NPM_TOKEN` (legacy / emergency only)

Do **not** keep a publish `NPM_TOKEN` in GitHub Secrets for normal releases. An invalid or stale secret wired as `NODE_AUTH_TOKEN` will make `changeset publish` use token auth instead of OIDC and fail.

If you must publish outside Actions (emergency), use a short-lived token locally and revoke it afterward. Prefer fixing Trusted Publishing over restoring a long-lived Actions secret.

## Re-running a stuck release

1. Confirm the Actions “create and approve PRs” toggle above.
2. Confirm each package’s Trusted Publisher still matches `kristijorgji` / `js-devkit` / `release.yml`.
3. Re-run the failed **Release** workflow on `main`, or land a PR so Release runs again.
4. Merge the **chore: version packages** PR when CI is green — that merge is what publishes.

### OIDC troubleshooting

| Symptom | Likely cause |
| ------- | ------------ |
| `ENEEDAUTH` / unable to authenticate | Workflow filename mismatch (`release.yml` must match npm settings exactly), missing `id-token: write`, or self-hosted runner |
| `E404` on publish of an existing package | Trusted Publisher owner/repo/workflow mismatch (npm often surfaces this as 404) |
| Token / 401 errors | `NODE_AUTH_TOKEN` still set from an old `NPM_TOKEN` secret — remove it from the workflow and delete the secret |
| OIDC ignored / old npm | Runner npm &lt; 11.5.1 — ensure the “Ensure npm supports Trusted Publishing” step ran |
