---
name: openapi-docs
description: >-
    Use when generating API route inventories or a Postman collection from an
    OpenAPI document, or checking committed API docs for drift.
---

# openapi-docs

CLI: `kj-openapi` from `@kristijorgji/openapi-docs`.

## Commands

| Command | Flags | When |
| --- | --- | --- |
| `docs` | | Write markdown / JSON / HTML |
| `check` | | Fail when committed files drift |
| `open` | `--serve`, `--port <n>` | Open the HTML viewer |
| `postman` | | Write a Postman collection |

## Config

`openapi-docs.config.ts` via `defineOpenApiDocsConfig({ document, viewerTitle, postman, ... })`.

Keep app-specific auth labels, permissions, token JSON paths, and footnotes in the consumer config. Do not hardcode them in this package.

`viewerTitle` defaults to `API routes`. `postman.baseUrlVar` defaults to `baseApiUrl`.
`postman.authPaths` defaults to `login` / `refresh` / `logout` suffixes.

## Security

Operation auth is read from OpenAPI `security` + `components.securitySchemes`. Heuristics (401/403 → bearer) are opt-in and path-agnostic.
