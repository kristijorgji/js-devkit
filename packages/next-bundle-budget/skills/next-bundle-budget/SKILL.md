---
name: next-bundle-budget
description: >-
    Use when working with Next.js bundle size budgets: adding or lowering caps,
    reading bundle history diffs, debugging size-limit failures, or wiring the
    kj-next-bundle CLI into a new project.
---

# next-bundle-budget

CLI: `kj-next-bundle` from `@kristijorgji/next-bundle-budget`.

## Commands

| Command | Flags | When |
| --- | --- | --- |
| `check` | `--skip-track`, `--track` | Enforce Brotli budgets after `next build` |
| `track` | `--baseline <sha>`, `--fail-on-growth` | Record a snapshot and print diffs |
| `history` | `--serve`, `--port <n>` | Open the HTML timeline |
| `sync-limits` | `--apply`, `--init-routes` | Lower (never raise) caps after shrinkage |
| `migrate-budgets` | `--out <path>` | Convert legacy TS budget files to JSON |

Env: `TRACK_BUNDLE_HISTORY=1` records a snapshot after a passing `check`. `SKIP_BUNDLE_TRACK=1` disables that.

## Config files

- `next-bundle-budget.config.ts` — `defineBundleBudgetConfig({ appRoot, extraGroups, resolveRouteName, viewerTitle, ... })`.
  `viewerTitle` sets the HTML history page title and heading (default `Bundle size history`).
- `bundle-budgets.json` — `{ groups: { framework: { limit: "58 KB" } }, routes: { home: { limit: "10 KB" } } }`
- `.size-limit.ts` — `export default buildSizeLimitEntries(config)`

`sync-limits --apply` rewrites `bundle-budgets.json` only. It never raises a cap unless `--init-routes` reseeds every route from measured size + 15% (+2 KB floor).

## Adapter capabilities

| Adapter | Per-route budgets | Named runtime chunks (`framework-*.js`) |
| --- | --- | --- |
| `next15-webpack` | yes (`app-build-manifest.json`) | yes |
| `next16-turbopack` | yes (`.next/diagnostics/route-bundle-stats.json`, undocumented) | no — hashed names + `turbopack-*` |
| `next16-webpack` | no — skip route layer with a warning | yes |

Auto-detect unless `adapter` is set in config.

## Adding a budget

Add a group id + limit in `bundle-budgets.json`. Extra artifacts (service worker) go in `extraGroups` on the config. Do not hardcode `.next` globs in the consumer — the adapter owns those.
