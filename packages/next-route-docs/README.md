# @kristijorgji/next-route-docs

Generate a Next.js App Router route inventory (markdown, JSON, HTML) and audit declared rendering against `.next/prerender-manifest.json`. Works with Next.js 15 and 16.

Rendering inference is a best-effort regex scan of source files. Use `kj-next-routes audit` after `next build` to cross-check against real build output.

## Install

```bash
pnpm add -D @kristijorgji/next-route-docs
```

## Setup

Create `next-route-docs.config.ts` next to the Next app:

```ts
import { defineRouteDocsConfig } from '@kristijorgji/next-route-docs/config';

export default defineRouteDocsConfig({
    appRoot: import.meta.dirname,
    viewerTitle: 'Routes',
    locales: ['en', 'de'],
    resolveRouteName: (sourcePath) => {
        const names: Record<string, string> = {
            '[locale]/page.tsx': 'home',
            '[locale]/posts/page.tsx': 'posts',
        };
        return names[sourcePath] ?? null;
    },
    resolveLocalizedPath: (routeName, locale) => {
        if (routeName === 'posts' && locale === 'de') return '/beitraege';
        if (routeName === 'posts') return '/posts';
        return null;
    },
});
```

Add scripts:

```json
{
  "scripts": {
    "routes:docs": "kj-next-routes generate",
    "routes:check": "kj-next-routes check",
    "routes:audit": "kj-next-routes audit",
    "routes:open": "kj-next-routes open"
  }
}
```

## Commands

| Command | Flags | When |
| --- | --- | --- |
| `generate` | | Write `docs/routes.md`, `.json`, `.html` |
| `check` | | Fail CI when committed docs drift |
| `audit` | | Compare declared ISR/SSG to `prerender-manifest.json` |
| `open` | `--serve`, `--port <n>` | Open the HTML viewer |

## Config

| Field | Default | Purpose |
| --- | --- | --- |
| `appRoot` | required | Next app package root |
| `appDir` | `src/app` or `app` | App Router directory |
| `outDir` / `basename` | `docs` / `routes` | Output files |
| `viewerTitle` | `Routes` | HTML title and heading |
| `locales` | `[]` | Omit locale columns when empty |
| `localeParam` | `locale` | Dynamic segment name, e.g. `/[locale]/posts` |
| `resolveRouteName` | `() => null` | Map `page.tsx` path to a logical name |
| `resolveLocalizedPath` | `() => null` | Per-locale public path |
| `resolveAuth` / `resolveIndexable` / `describe` | no-ops | App-specific columns |
| `ignorePublicPaths` | `[]` | Globs skipped under `public/` |
| `formatMarkdown` | identity | Optional markdownlint / prettier pass |
| `adapter` | `auto` | `next15` or `next16` |

`audit` returns a skipped result (warning, exit 0) when the adapter cannot read `prerender-manifest.json`.

## License

MIT
