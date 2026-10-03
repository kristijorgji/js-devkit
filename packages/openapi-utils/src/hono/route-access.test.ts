import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import type { MiddlewareHandler } from 'hono';
import { describe, expect, it } from 'vitest';

import { jsonContent } from './content.js';
import { createRouteAccessKit } from './route-access.js';

type Access = 'public' | 'bearer';

function createFakeAuth(): { middleware: MiddlewareHandler; state: { calls: number } } {
    const state = { calls: 0 };
    const middleware: MiddlewareHandler = async (c, next) => {
        state.calls += 1;
        if (!c.req.header('authorization')) {
            return c.body(null, 401);
        }
        await next();
    };
    return { middleware, state };
}

function createKit(fakeAuth: MiddlewareHandler) {
    return createRouteAccessKit<Access>({
        security: {
            public: [],
            bearer: [{ bearerAuth: [] }],
        },
        accessMiddleware: { bearer: [fakeAuth] },
        authenticatedAccess: 'bearer',
        createApp: () => new OpenAPIHono(),
    });
}

const petSchema = z.object({ id: z.string() });

describe('createRouteAccessKit', () => {
    it('stores access and OpenAPI security on createApiRoute', () => {
        const fakeAuth = createFakeAuth();
        const kit = createKit(fakeAuth.middleware);
        const route = kit.createApiRoute('bearer', {
            method: 'get',
            path: '/pets',
            responses: { 200: jsonContent(petSchema, 'Pet') },
        });
        expect(kit.getRouteAccess(route)).toBe('bearer');
        expect(route.security).toEqual([{ bearerAuth: [] }]);
    });

    it('returns 401 without a header and 200 with one on a bearer route', async () => {
        const fakeAuth = createFakeAuth();
        const kit = createKit(fakeAuth.middleware);
        const plain = new OpenAPIHono();
        kit.registerOpenAPIRoute(plain, {
            route: kit.createApiRoute('bearer', {
                method: 'get',
                path: '/pets',
                responses: { 200: jsonContent(petSchema, 'Pet') },
            }),
            handler: (c) => c.json({ id: '1' }),
        });
        expect((await plain.request('/pets')).status).toBe(401);
        expect((await plain.request('/pets', { headers: { authorization: 'Bearer t' } })).status).toBe(200);
    });

    it('does not call access middleware on a public route', async () => {
        const fakeAuth = createFakeAuth();
        const kit = createKit(fakeAuth.middleware);
        const app = new OpenAPIHono();
        kit.registerOpenAPIRoute(app, {
            route: kit.createApiRoute('public', {
                method: 'get',
                path: '/pets',
                responses: { 200: jsonContent(petSchema, 'Pet') },
            }),
            handler: (c) => c.json({ id: '1' }),
        });
        expect((await app.request('/pets')).status).toBe(200);
        expect(fakeAuth.state.calls).toBe(0);
    });

    it('runs extra middleware on a public route', async () => {
        const fakeAuth = createFakeAuth();
        const kit = createKit(fakeAuth.middleware);
        const extraCalls: string[] = [];
        const extra: MiddlewareHandler = async (_c, next) => {
            extraCalls.push('extra');
            await next();
        };
        const app = new OpenAPIHono();
        kit.registerOpenAPIRoute(app, {
            route: kit.createApiRoute('public', {
                method: 'get',
                path: '/pets',
                responses: { 200: jsonContent(petSchema, 'Pet') },
            }),
            handler: (c) => c.json({ id: '1' }),
            middleware: [extra],
        });
        expect((await app.request('/pets')).status).toBe(200);
        expect(extraCalls).toEqual(['extra']);
        expect(fakeAuth.state.calls).toBe(0);
    });

    it('runs access middleware once on an authenticated router without extras', async () => {
        const fakeAuth = createFakeAuth();
        const kit = createKit(fakeAuth.middleware);
        const app = kit.createAuthenticatedRouter();
        kit.registerOpenAPIRoute(app, {
            route: kit.createApiRoute('bearer', {
                method: 'get',
                path: '/pets',
                responses: { 200: jsonContent(petSchema, 'Pet') },
            }),
            handler: (c) => c.json({ id: '1' }),
        });
        expect((await app.request('/pets', { headers: { authorization: 'Bearer t' } })).status).toBe(200);
        expect(fakeAuth.state.calls).toBe(1);
    });

    it('registers a plain createRoute with no middleware', async () => {
        const fakeAuth = createFakeAuth();
        const kit = createKit(fakeAuth.middleware);
        const app = new OpenAPIHono();
        kit.registerOpenAPIRoute(app, {
            route: createRoute({
                method: 'get',
                path: '/health',
                responses: { 200: jsonContent(petSchema, 'Pet') },
            }),
            handler: (c) => c.json({ id: 'ok' }),
        });
        expect((await app.request('/health')).status).toBe(200);
        expect(fakeAuth.state.calls).toBe(0);
    });

    it('emits bearer and public security on the OpenAPI document', async () => {
        const fakeAuth = createFakeAuth();
        const kit = createKit(fakeAuth.middleware);
        const app = new OpenAPIHono();
        kit.registerOpenAPIRoute(app, {
            route: kit.createApiRoute('bearer', {
                method: 'get',
                path: '/pets',
                responses: { 200: jsonContent(petSchema, 'Pet') },
            }),
            handler: (c) => c.json({ id: '1' }),
        });
        kit.registerOpenAPIRoute(app, {
            route: kit.createApiRoute('public', {
                method: 'get',
                path: '/health',
                responses: { 200: jsonContent(petSchema, 'Pet') },
            }),
            handler: (c) => c.json({ id: 'ok' }),
        });
        app.doc('/doc', {
            openapi: '3.1.0',
            info: { title: 'Pets', version: '1' },
        });
        const doc = (await (await app.request('/doc')).json()) as {
            paths: Record<string, { get?: { security?: unknown } }>;
        };
        expect(doc.paths['/pets']?.get?.security).toEqual([{ bearerAuth: [] }]);
        expect(doc.paths['/health']?.get?.security).toEqual([]);
    });
});
