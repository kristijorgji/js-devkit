# Changesets

This monorepo uses [Changesets](https://github.com/changesets/changesets) for versioning and publishing.

Every PR that changes anything under `packages/**` must include a changeset:

```bash
pnpm changeset
```

For chore-only PRs with no package impact:

```bash
pnpm changeset --empty
```

See [CONTRIBUTING.md](../CONTRIBUTING.md) for the full release process.
