import { OpenAPIHono } from '@hono/zod-openapi';
import { describe, expect, it } from 'vitest';

import { buildBaseUrlServer, registerOpenApiDoc } from './docs.js';

describe('buildBaseUrlServer', () => {
    it('builds a server with a variable and path suffix in key order', () => {
        const server = buildBaseUrlServer({
            variable: {
                name: 'baseUrl',
                default: 'http://localhost:3018',
                enum: ['http://localhost:3018', 'https://api.example.com'],
                description: 'API origin',
            },
            pathSuffix: '/api/v1',
            description: 'V1 API',
        });
        const expected = {
            url: '{baseUrl}/api/v1',
            description: 'V1 API',
            variables: {
                baseUrl: {
                    default: 'http://localhost:3018',
                    enum: ['http://localhost:3018', 'https://api.example.com'],
                    description: 'API origin',
                },
            },
        };
        expect(server).toEqual(expected);
        expect(JSON.stringify(server)).toBe(JSON.stringify(expected));
    });
});

describe('registerOpenApiDoc', () => {
    it('serves openapi, info, and servers in order', async () => {
        const app = new OpenAPIHono();
        const servers = [
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
        ];
        registerOpenApiDoc(app, {
            info: { title: 'Pets API', version: '1', description: 'Pets' },
            servers,
        });
        const res = await app.request('/openapi.json');
        expect(res.status).toBe(200);
        const body = (await res.json()) as Record<string, unknown>;
        expect(Object.keys(body).slice(0, 3)).toEqual(['openapi', 'info', 'servers']);
        expect(body.openapi).toBe('3.1.0');
        expect(body.info).toEqual({ title: 'Pets API', version: '1', description: 'Pets' });
        expect(body.servers).toEqual(servers);
    });

    it('serves Swagger UI when swaggerUi is set', async () => {
        const app = new OpenAPIHono();
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
                    description: 'Root API',
                }),
            ],
            swaggerUi: { path: '/docs', specUrl: '/api/v1/openapi.json' },
        });
        const docs = await app.request('/docs');
        expect(docs.status).toBe(200);
        expect(await docs.text()).toMatch(/swagger/i);
    });

    it('returns 404 for /docs when swaggerUi is omitted', async () => {
        const app = new OpenAPIHono();
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
                    description: 'Root API',
                }),
            ],
        });
        expect((await app.request('/docs')).status).toBe(404);
    });
});
