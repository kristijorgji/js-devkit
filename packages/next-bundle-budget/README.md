# @kristijorgji/next-bundle-budget

Next.js production bundle size budgets, history tracking, and an HTML timeline viewer.

Works with Next 15 (webpack) and Next 16 (Turbopack / webpack) via a build-output adapter.

## Install

```bash
pnpm add -D @kristijorgji/next-bundle-budget size-limit @size-limit/file
```

## Setup

1. Create `next-bundle-budget.config.ts` in the Next app root.
2. Create `bundle-budgets.json` (or run `kj-next-bundle migrate-budgets` if you already have legacy TS budget files).
3. Point `.size-limit.ts` at `buildSizeLimitEntries`.
4. Add scripts:

```json
{
  "scripts": {
    "size-limit": "kj-next-bundle check",
    "bundle:track": "kj-next-bundle track",
    "bundle:history": "kj-next-bundle history",
    "bundle:sync-limits": "kj-next-bundle sync-limits"
  }
}
```

`kj-next-bundle check` honors `TRACK_BUNDLE_HISTORY=1` and `SKIP_BUNDLE_TRACK=1`.

## Commands

| Command | Purpose |
| --- | --- |
| `check` | Rebuild if needed, run size-limit, optionally track |
| `track` | Snapshot + diff (`--baseline`, `--fail-on-growth`) |
| `history` | HTML viewer (`--serve`, `--port`) |
| `sync-limits` | Lower caps (`--apply`, `--init-routes`) — never raises except `--init-routes` |
| `migrate-budgets` | Convert legacy TS budget files to JSON |

## License

MIT
