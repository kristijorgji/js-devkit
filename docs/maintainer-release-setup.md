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

## npm: `NPM_TOKEN` secret

Required repo secret: **`NPM_TOKEN`**.

- Prefer an npm **Automation** classic token, or a granular token that can publish `@kristijorgji/*` and bypass 2FA.
- Wire it only as a GitHub Actions secret. `setup-node` with `registry-url` maps it to `NODE_AUTH_TOKEN` for `changeset publish`.
- Do **not** put the token in workspace `.npmrc` files.

```bash
# Confirm the secret exists (names only; values are never shown)
gh secret list -R kristijorgji/js-devkit
```

If Release logs show an empty `NODE_AUTH_TOKEN` / auth failures on publish, the secret is missing or revoked.

```bash
# Set or rotate (paste token when prompted)
gh secret set NPM_TOKEN -R kristijorgji/js-devkit
```

## Provenance

[`.github/workflows/release.yml`](../.github/workflows/release.yml) sets `permissions.id-token: write`. Each publishable package has `"publishConfig": { "access": "public", "provenance": true }`. Together they attach npm provenance attestations on publish.

## Re-running a stuck release

1. Confirm the Actions toggle and `NPM_TOKEN` above.
2. Re-run the failed **Release** workflow on `main`, or push an empty commit / land a PR so Release runs again.
3. Merge the **chore: version packages** PR when CI is green — that merge is what publishes.
