---
name: seo-audit
description: >-
    Use when validating robots.txt and sitemaps, auditing rendered page SEO
    (title, canonical, hreflang, robots, Open Graph), or generating an HTML SEO report.
---

# seo-audit

CLI: `kj-seo` from `@kristijorgji/seo-audit`.

## Commands

| Command | Flags | When |
| --- | --- | --- |
| `sitemaps` | `--secret`, `--sample <n\|all>` | robots.txt, sitemap XSD, sampled pages, 404 probes |
| `pages` | `--secret`, `--max-urls`, `--crawl-depth`, `--concurrency`, `--locales`, `--lighthouse`, `--out`, `--fail-on` | Per-page metadata audit and HTML report |

## Config

`seo-audit.config.ts` via `defineSeoAuditConfig({ locales, sitemaps, robots, routes, fetch, report, rules })`.

Keep app-specific locales, sitemap secret paths, robots allow/disallow lists, and user-agents in the consumer config. Do not hardcode them in this package.

Missing config is not an error: defaults apply (`/sitemap.xml`, `Googlebot`, no secret sitemap).

## Reports

`kj-seo pages` writes `report.json` and `report.html` under `report.outDir` (default `.cache/seo-audit`) or `--out`. Exit 1 when issues meet `--fail-on` (default `error`).
