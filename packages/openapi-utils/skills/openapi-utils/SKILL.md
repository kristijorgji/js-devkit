---
name: openapi-utils
description: >-
    Use when merging versioned OpenAPI documents, adding Hono OpenAPI helpers,
    or adding another OpenAPI helper to @kristijorgji/openapi-utils.
---

# openapi-utils

Library: `@kristijorgji/openapi-utils`. No CLI.

## Merge

`extractVersionPrefix(serverUrl, sourceName)` plus `mergeSpecs([{ name, versionPrefix, doc }, ...])`.

The first module is a versioned-spec merge. Example server variable: `{baseUrl}`. Keep app hosts, dump/fetch scripts, and Hono routers in the consumer.

`@kristijorgji/openapi-docs` generates route docs and Postman from one document. Do not fold that work into this package.

## Hono

Import from `@kristijorgji/openapi-utils/hono` (not the root entry):

- `jsonContent`, `multipartFormContent`
- `withOpenApi`
- `createRouteAccessKit` (`createApiRoute`, `registerOpenAPIRoute`, `createAuthenticatedRouter`, `getRouteAccess`)
- `buildBaseUrlServer`, `registerOpenApiDoc`

The app passes auth middleware, the validation hook, and server hosts into the kit. The root entry stays dependency-free. Hono, Zod, and Swagger UI imports live only in `src/hono/`.

## Out of scope

Dump/fetch scripts, docs generation, app-specific auth, error schemas.
