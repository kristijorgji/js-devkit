---
name: next-route-docs
description: >-
    Use when generating Next.js App Router route inventories, checking committed
    route docs for drift, or auditing declared rendering against prerender-manifest.json.
---

# next-route-docs

CLI: `kj-next-routes` from `@kristijorgji/next-route-docs`.

## Commands

| Command | Flags | When |
| --- | --- | --- |
| `generate` | | Write markdown / JSON / HTML |
| `check` | | Fail when committed files drift |
| `audit` | | Compare declared rendering to build output |
| `open` | `--serve`, `--port <n>` | Open the HTML viewer |

## Config

`next-route-docs.config.ts` via `defineRouteDocsConfig({ appRoot, viewerTitle, locales, resolveRouteName, ... })`.

Keep app-specific names, auth, SEO, and locale maps in the consumer config. Do not hardcode them in this package.

`viewerTitle` defaults to `Routes`. `locales` defaults to `[]` (no locale columns).

## Adapters

| Adapter | Detect | prerender-manifest |
| --- | --- | --- |
| `next16` | `.next/prerender-manifest.json` + `.next/diagnostics/` | yes |
| `next15` | `.next/prerender-manifest.json` without diagnostics | yes |
| fallback | neither | no — `audit` warns and skips |

## Rendering heuristic

`parseRouteSource` is a regex scan (`searchParams`, `cookies(`, `revalidate`). Treat labels as best-effort. After `next build`, run `kj-next-routes audit`.
