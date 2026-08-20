import { describe, expect, it } from 'vitest';

import { buildOperationMetadataIndex } from '../openapi/metadata-index.js';
import type { OpenApiDocument } from '../openapi/types.js';

import { flattenApiFolder, groupAdminTaggedRequests, groupUnversionedRequests } from './folders.js';
import { stripRequestExamples } from './events.js';
import { toOpenApiRelativePath } from '../openapi/paths.js';
import type { PostmanItem } from './types.js';

describe('postman folders', () => {
    it('flattenApiFolder hoists api children to the collection root', () => {
        const items: PostmanItem[] = [
            {
                name: 'api',
                item: [
                    { name: 'v1', item: [{ name: 'GET health', request: { method: 'GET' } }] },
                    { name: 'v2', item: [{ name: 'GET ping', request: { method: 'GET' } }] },
                ],
            },
        ];

        flattenApiFolder(items);

        expect(items.map((item) => item.name)).toEqual(['v1', 'v2']);
        expect(items[0]?.item?.[0]?.name).toBe('GET health');
    });

    it('stripRequestExamples removes saved responses from leaf requests', () => {
        const items: PostmanItem[] = [
            {
                name: 'v1',
                item: [
                    {
                        name: 'POST login',
                        request: { method: 'POST' },
                        response: [{ code: 200 }],
                    },
                ],
            },
        ];

        stripRequestExamples(items);

        expect(items[0]?.item?.[0]?.response).toBeUndefined();
    });

    it('toOpenApiRelativePath strips api version prefix', () => {
        expect(toOpenApiRelativePath('/api/v1/posts/{id}/approve', ['api', 'v1'])).toBe('/posts/{id}/approve');
    });

    it('groupAdminTaggedRequests moves Admin-tagged requests under v1/admin', () => {
        const openApiDoc: OpenApiDocument = {
            openapi: '3.0.0',
            paths: {
                '/api/v1/posts/{id}/approve': {
                    patch: { tags: ['Admin', 'Posts'], summary: 'Approve post' },
                },
            },
        };
        const metadataIndex = buildOperationMetadataIndex(openApiDoc, ['api', 'v1']);
        const items: PostmanItem[] = [
            {
                name: 'v1',
                item: [
                    {
                        name: 'posts',
                        item: [
                            {
                                name: 'PATCH approve',
                                request: {
                                    method: 'PATCH',
                                    url: { path: ['api', 'v1', 'posts', ':id', 'approve'] },
                                },
                            },
                        ],
                    },
                ],
            },
        ];

        groupAdminTaggedRequests(items, metadataIndex, {
            adminTag: 'Admin',
            serverBasePath: ['api', 'v1'],
        });

        const adminFolder = items[0]?.item?.find((entry) => entry.name === 'admin');
        const postsFolder = adminFolder?.item?.find((entry) => entry.name === 'posts');
        expect(postsFolder?.item?.[0]?.name).toBe('Approve post');
        expect(items[0]?.item?.some((entry) => entry.name === 'posts')).toBe(false);
    });

    it('groupUnversionedRequests moves unversioned paths under root/', () => {
        const openApiDoc: OpenApiDocument = {
            openapi: '3.0.0',
            paths: {
                '/health': {
                    get: { summary: 'Health check' },
                },
            },
        };
        const metadataIndex = buildOperationMetadataIndex(openApiDoc, []);
        const items: PostmanItem[] = [
            {
                name: 'health',
                request: {
                    method: 'GET',
                    url: { path: ['health'] },
                },
            },
            {
                name: 'v1',
                item: [
                    {
                        name: 'GET ping',
                        request: {
                            method: 'GET',
                            url: { path: ['api', 'v1', 'health', 'ping'] },
                        },
                    },
                ],
            },
        ];

        groupUnversionedRequests(items, metadataIndex, { serverBasePath: [] });

        const rootFolder = items.find((entry) => entry.name === 'root');
        expect(rootFolder?.item?.map((entry) => entry.name)).toEqual(['Health check']);
        expect(items.some((entry) => entry.name === 'health')).toBe(false);
        expect(items.find((entry) => entry.name === 'v1')?.item).toHaveLength(1);
    });
});
