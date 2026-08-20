import { describe, expect, it } from 'vitest';

import { buildOperationSecurityIndex } from './security-index.js';
import type { OpenApiDocument, OpenApiSecurityScheme } from './types.js';

const bearerScheme: Record<string, OpenApiSecurityScheme> = {
    bearerAuth: { type: 'http', scheme: 'bearer' },
};

const apiKeyScheme: Record<string, OpenApiSecurityScheme> = {
    apiKeyAuth: { type: 'apiKey', in: 'header', name: 'X-API-Key' },
};

describe('buildOperationSecurityIndex', () => {
    it('keys match relative paths after stripping api/v1', () => {
        const openApiDoc: OpenApiDocument = {
            openapi: '3.0.0',
            paths: {
                '/api/v1/posts': {
                    post: { security: [{ bearerAuth: [] }] },
                },
            },
            components: { securitySchemes: bearerScheme },
        };

        const index = buildOperationSecurityIndex(openApiDoc, [], { apiKeyHeaderName: 'X-API-Key' });

        expect(index.get('POST /posts')).toEqual({
            bearer: true,
            apiKey: false,
            source: 'openapi',
        });
    });

    it('detects apiKey-only operations', () => {
        const openApiDoc: OpenApiDocument = {
            openapi: '3.0.0',
            paths: {
                '/api/v1/sitemap': {
                    get: { security: [{ apiKeyAuth: [] }] },
                },
            },
            components: { securitySchemes: apiKeyScheme },
        };

        const index = buildOperationSecurityIndex(openApiDoc, [], { apiKeyHeaderName: 'X-API-Key' });

        expect(index.get('GET /sitemap')).toEqual({
            bearer: false,
            apiKey: true,
            source: 'openapi',
        });
    });

    it('detects bearer or apiKey operations', () => {
        const openApiDoc: OpenApiDocument = {
            openapi: '3.0.0',
            paths: {
                '/api/v1/posts': {
                    get: { security: [{ apiKeyAuth: [] }, { bearerAuth: [] }] },
                },
            },
            components: { securitySchemes: { ...bearerScheme, ...apiKeyScheme } },
        };

        const index = buildOperationSecurityIndex(openApiDoc, [], { apiKeyHeaderName: 'X-API-Key' });

        expect(index.get('GET /posts')).toEqual({
            bearer: true,
            apiKey: true,
            source: 'openapi',
        });
    });

    it('marks explicit public security as none', () => {
        const openApiDoc: OpenApiDocument = {
            openapi: '3.0.0',
            paths: {
                '/api/v1/auth/login': {
                    post: { security: [] },
                },
            },
            components: { securitySchemes: bearerScheme },
        };

        const index = buildOperationSecurityIndex(openApiDoc, [], { apiKeyHeaderName: 'X-API-Key' });

        expect(index.get('POST /auth/login')).toEqual({
            bearer: false,
            apiKey: false,
            source: 'none',
        });
    });
});
