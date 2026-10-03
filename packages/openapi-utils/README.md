# @kristijorgji/openapi-utils

Reusable OpenAPI helpers: versioned-spec merge and Hono route/docs helpers. Later helpers belong in this package, not a new npm name.

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

## Hono helpers (`@kristijorgji/openapi-utils/hono`)

Peers for this subpath:

```bash
pnpm add @hono/zod-openapi hono zod @hono/swagger-ui
```

The app keeps its auth middleware, error schemas, validation hook, and audit logic and passes them in.

```ts
import { OpenAPIHono, z } from '@hono/zod-openapi';
import {
    buildBaseUrlServer,
    createRouteAccessKit,
    jsonContent,
    registerOpenApiDoc,
    withOpenApi,
} from '@kristijorgji/openapi-utils/hono';

const PetSchema = withOpenApi(z.object({ id: z.string() }), 'Pet');

const kit = createRouteAccessKit({
    security: {
        public: [],
        bearer: [{ bearerAuth: [] }],
    },
    accessMiddleware: { bearer: [authMiddleware] },
    authenticatedAccess: 'bearer',
    createApp: () => new OpenAPIHono(),
});

const app = kit.createAuthenticatedRouter();
kit.registerOpenAPIRoute(app, {
    route: kit.createApiRoute('bearer', {
        method: 'get',
        path: '/pets',
        responses: { 200: jsonContent(PetSchema, 'Pet') },
    }),
    handler: (c) => c.json({ id: '1' }),
});

registerOpenApiDoc(app, {
    info: { title: 'Pets API', version: '1', description: 'Pets' },
    servers: [
        buildBaseUrlServer({
            variable: {
                name: 'baseUrl',
                default: 'http://localhost:3018',
                enum: ['http://localhost:3018'],
                description: 'API origin',
            },
            pathSuffix: '/api/v1',
            description: 'V1 API',
        }),
    ],
    swaggerUi: { path: '/docs', specUrl: '/api/v1/openapi.json' },
});
```

## Out of scope

Dump/fetch scripts, docs generation (see [`@kristijorgji/openapi-docs`](https://www.npmjs.com/package/@kristijorgji/openapi-docs)), app-specific auth, and error schemas.
