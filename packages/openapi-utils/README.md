# @kristijorgji/openapi-utils

Reusable OpenAPI helpers. The first module merges versioned OpenAPI documents into one spec. Later helpers (for example Hono content builders) belong in this package, not a new npm name.

Route docs and Postman generation stay in [`@kristijorgji/openapi-docs`](https://www.npmjs.com/package/@kristijorgji/openapi-docs). Reading files, dumping Hono routers, and fetching localhost stay in the app.

## Install

```bash
pnpm add -D @kristijorgji/openapi-utils
```

## Merge versioned specs

```ts
import { extractVersionPrefix, mergeSpecs } from '@kristijorgji/openapi-utils';

const v1 = {
    openapi: '3.1.0',
    info: { title: 'Pets' },
    servers: [{ url: '{baseUrl}/api/v1' }],
    paths: { '/pets': { get: { operationId: 'listPets' } } },
};
const v2 = {
    openapi: '3.1.0',
    info: { title: 'Pets' },
    servers: [{ url: '{baseUrl}/api/v2' }],
    paths: { '/pets': { get: { operationId: 'listPets' } } },
};

const merged = mergeSpecs([
    { name: 'v1', versionPrefix: extractVersionPrefix(v1.servers[0].url, 'v1'), doc: v1 },
    { name: 'v2', versionPrefix: extractVersionPrefix(v2.servers[0].url, 'v2'), doc: v2 },
]);
```

`extractVersionPrefix` reads the `/api/<version>` suffix after an optional `{serverVariable}`. `mergeSpecs` prefixes paths, suffixes duplicate `operationId`s, and errors on conflicting components or tags. The combined `servers[0].url` is the shared variable (`{baseUrl}`), and `info.version` is `combined`.

## Out of scope

Hono route registration, app-specific server URLs, dump/fetch scripts, and docs generation.
