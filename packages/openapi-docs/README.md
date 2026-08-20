# @kristijorgji/openapi-docs

Generate API route docs (markdown, JSON, HTML) and a Postman collection from an OpenAPI document. Framework-agnostic: the input is the spec, not Hono, Fastify, or Nest.

## Install

```bash
pnpm add -D @kristijorgji/openapi-docs
```

## Setup

Create `openapi-docs.config.ts` next to the API package:

```ts
import { defineOpenApiDocsConfig } from '@kristijorgji/openapi-docs/config';

export default defineOpenApiDocsConfig({
    document: 'docs/openapi.json',
    viewerTitle: 'API routes',
    postman: {
        baseUrlVar: 'baseApiUrl',
        accessTokenJsonPath: 'data.tokens.accessToken',
        refreshTokenJsonPath: 'data.tokens.refreshToken',
        authPaths: {
            login: ['login'],
            refresh: ['refresh'],
            logout: ['logout'],
        },
    },
});
```

App-specific auth labels, permissions, and footnotes stay in the consumer config:

```ts
resolveAuthLabel: (op, security) => {
    if (op.method === 'GET' && op.path === '/posts') return 'No [^list]';
    if (!security.bearer && !security.apiKey) return 'No';
    if (security.bearer && security.apiKey) return 'JWT or API key';
    if (security.bearer) return 'JWT';
    return 'API key';
},
resolvePermissions: (op) => (op.path.startsWith('/posts') && op.method !== 'GET' ? ['posts:write'] : []),
footnotes: ['[^list]: List is public at the middleware layer.'],
```

Add scripts:

```json
{
  "scripts": {
    "api:docs": "kj-openapi docs",
    "api:check": "kj-openapi check",
    "api:open": "kj-openapi open",
    "api:postman": "kj-openapi postman"
  }
}
```

## Commands

| Command | Flags | When |
| --- | --- | --- |
| `docs` | | Write `docs/api-routes.md`, `.json`, `.html` |
| `check` | | Fail CI when committed docs drift |
| `open` | `--serve`, `--port <n>` | Open the HTML viewer |
| `postman` | | Write `docs/postman.collection.json` |

## Config

| Field | Default | Purpose |
| --- | --- | --- |
| `document` | required | Path to OpenAPI JSON |
| `outDir` / `basename` | `docs` / `api-routes` | Docs output files |
| `viewerTitle` | `API routes` | HTML title and heading |
| `apiKeyHeaderName` | `X-API-Key` | Header used to detect API-key schemes |
| `resolveAuthLabel` | JWT / API key / No | Per-operation auth column |
| `resolvePermissions` | `[]` | Per-operation permissions column |
| `describe` | OpenAPI `summary` | Description column |
| `footnotes` | `[]` | Markdown footnotes after the table |
| `formatMarkdown` | identity | Optional markdownlint / prettier pass |
| `postman.baseUrlVar` | `baseApiUrl` | Collection host variable |
| `postman.authPaths` | `login` / `refresh` / `logout` | Suffixes that get login/refresh/logout scripts |
| `postman.accessTokenJsonPath` | `data.tokens.accessToken` | Dot path into `pm.response.json()` |

`postman.enableSecurityHeuristics` is off by default. When on, a 401/403 example implies bearer — there is no path-prefix policy in this package.

## License

MIT
