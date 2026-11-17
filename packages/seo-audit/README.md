# @kristijorgji/seo-audit

Validate `robots.txt` and sitemaps, then audit rendered pages (title, canonical, hreflang, robots, Open Graph) with an HTML report. CLI: `kj-seo`.

## Install

```bash
pnpm add -D @kristijorgji/seo-audit
```

Optional Lighthouse scores (`--lighthouse n`) need:

```bash
pnpm add -D lighthouse chrome-launcher
```

## Setup

Create `seo-audit.config.ts` next to the app (or any parent directory). If the file is missing, defaults apply.

```ts
import { defineSeoAuditConfig } from '@kristijorgji/seo-audit/config';

export default defineSeoAuditConfig({
    secretEnv: 'SITEMAP_SECRET',
    locales: { supported: ['en', 'de'], indexable: ['en', 'de'], default: 'en' },
    sitemaps: { secretIndexPath: (secret) => `/sitemaps/${secret}/index.xml` },
    robots: {
        forbiddenSubstrings: ['/sitemaps/'],
        mustAllow: ['/en', '/de'],
        mustDisallow: ['/en/dashboard'],
    },
    notFoundProbes: ['/en/__missing__/x'],
    routes: { file: 'docs/web-routes.json' },
    fetch: { userAgent: 'kj-seo-audit/1.0 (+https://www.example.com)' },
    report: { outDir: '.cache/seo-audit' },
});
```

Add scripts:

```json
{
  "scripts": {
    "seo:sitemaps": "kj-seo sitemaps",
    "seo:pages": "kj-seo pages"
  }
}
```

## Commands

| Command | Flags | Defaults |
| --- | --- | --- |
| `kj-seo sitemaps <baseUrl>` | `--secret <token>`, `--sample <n\|all>` | sample `20`; secret from `secretEnv` |
| `kj-seo pages <baseUrl>` | `--secret`, `--max-urls`, `--crawl-depth`, `--concurrency`, `--locales`, `--lighthouse`, `--out`, `--fail-on` | `500`, `2`, `4`, indexable locales, lighthouse `0`, `--fail-on error` |

Exit `0` on pass. Exit `1` when sitemap checks fail, or when page issues meet `--fail-on` (`error`, `warn`, or `none`).

## Config

| Field | Default |
| --- | --- |
| `secretEnv` | unset (no env fallback) |
| `locales.supported` | `locales` in the routes file, else `[]` |
| `locales.indexable` | `supported` |
| `locales.default` | `supported[0]` |
| `sitemaps.publicPath` | `/sitemap.xml` |
| `sitemaps.secretIndexPath` | unset (secret mode off) |
| `robots.userAgent` | `Googlebot` |
| `robots.forbiddenSubstrings` | `[]` |
| `robots.mustAllow` | `['/']` |
| `robots.mustDisallow` | `[]` |
| `notFoundProbes` | `['/__kj-seo-404-probe__/x']` |
| `routes.file` | unset (coverage skipped, route names `unknown`) |
| `fetch.userAgent` | `kj-seo-audit/1.0 (+https://github.com/kristijorgji/js-devkit)` |
| `crawl.skipPathPrefixes` | `['/api', '/_next']` |
| `crawl.skipExtensions` | png, jpg, webp, avif, svg, pdf, xml, txt, ico |
| `crawl.queryCapPerPath` | `3` |
| `rules.thresholds` | title 30–65, description 70–160 |
| `rules.overrides` | `{}` (`error` / `warn` / `info` / `off` per rule id) |
| `rules.requiredOpenGraph` | title, description, url, image, type, site_name |
| `rules.buildAssetMarker` | `/_next/static/` (`false` disables the check) |
| `report.outDir` | `.cache/seo-audit` |

Keep app-specific locales, routes, sitemap secrets, and robots paths in the consumer config. Do not hardcode them in this package.

## Rules

| Id | Severity | Applies |
| --- | --- | --- |
| `common.html-lang` | error | all |
| `common.single-title` | error | all |
| `common.viewport` | warn | all |
| `common.assets-single-build` | error | all |
| `common.jsonld-valid` | error | all |
| `common.jsonld-dataset-description` | error | all |
| `common.http-status` | error | all |
| `idx.title-present` | error | indexable |
| `idx.title-length` | warn | indexable |
| `idx.description-present` | error | indexable |
| `idx.description-length` | warn | indexable |
| `idx.canonical-present` | error | indexable |
| `idx.canonical-self` | error | indexable |
| `idx.hreflang-complete` | error | indexable |
| `idx.hreflang-self` | error | indexable |
| `idx.og-required` | error | indexable |
| `idx.og-url-matches-canonical` | warn | indexable |
| `idx.og-image-absolute` | error | indexable |
| `idx.twitter-card` | warn | indexable |
| `idx.single-h1` | warn | indexable |
| `idx.in-sitemap` | warn | indexable |
| `noidx.not-in-sitemap` | error | noindex |
| `noidx.canonical-elsewhere` | info | noindex |
| `cross.hreflang-reciprocal` | error | cross |
| `cross.canonical-target-ok` | error | cross |
| `cross.duplicate-title` | warn | cross |
| `cross.duplicate-description` | warn | cross |
| `cross.alternate-status` | warn | cross |

## License

MIT
