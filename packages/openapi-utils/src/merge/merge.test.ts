import { describe, expect, it } from 'vitest';

import type { OpenApiDocument, OpenApiSourceSpec } from '../types.js';
import { extractVersionPrefix, mergeSpecs } from './merge.js';

function petDoc(serverUrl: string, extras: Partial<OpenApiDocument> = {}): OpenApiDocument {
    return {
        openapi: '3.1.0',
        info: { title: 'Pets' },
        servers: [{ url: serverUrl }],
        paths: {
            '/pets': {
                get: { operationId: 'listPets' },
            },
        },
        ...extras,
    };
}

function petSpec(name: string, serverUrl: string, extras: Partial<OpenApiDocument> = {}): OpenApiSourceSpec {
    return {
        name,
        versionPrefix: extractVersionPrefix(serverUrl, name),
        doc: petDoc(serverUrl, extras),
    };
}

describe('extractVersionPrefix', () => {
    it('reads the suffix after a server variable', () => {
        expect(extractVersionPrefix('{baseUrl}/api/v1', 'v1')).toBe('/api/v1');
    });

    it('returns an empty prefix when the URL has no server variable', () => {
        expect(extractVersionPrefix('http://localhost:3018/api/v1', 'v1')).toBe('');
    });

    it('throws when the suffix is not under /api/', () => {
        expect(() => extractVersionPrefix('{baseUrl}/v1', 'v1')).toThrow('/api/');
    });

    it('throws when servers[0].url is missing', () => {
        expect(() => extractVersionPrefix(undefined, 'v1')).toThrow('missing servers[0].url');
    });
});

describe('mergeSpecs', () => {
    it('prefixes paths and suffixes a duplicate operationId', () => {
        const merged = mergeSpecs([
            petSpec('v1', '{baseUrl}/api/v1'),
            petSpec('v2', '{baseUrl}/api/v2'),
        ]);
        expect(Object.keys(merged.paths ?? {}).sort()).toEqual(['/api/v1/pets', '/api/v2/pets']);
        expect((merged.paths?.['/api/v1/pets'] as { get?: { operationId?: string } }).get?.operationId).toBe(
            'listPets',
        );
        expect((merged.paths?.['/api/v2/pets'] as { get?: { operationId?: string } }).get?.operationId).toBe(
            'listPets_v2',
        );
        expect(merged.info?.version).toBe('combined');
        expect(merged.servers?.[0]?.url).toBe('{baseUrl}');
    });

    it('keeps a shared component schema', () => {
        const pet = { type: 'object' };
        const merged = mergeSpecs([
            petSpec('v1', '{baseUrl}/api/v1', { components: { schemas: { Pet: pet } } }),
            petSpec('v2', '{baseUrl}/api/v2', { components: { schemas: { Pet: pet } } }),
        ]);
        expect(merged.components?.schemas).toEqual({ Pet: pet });
    });

    it('throws on a component schema conflict', () => {
        expect(() =>
            mergeSpecs([
                petSpec('v1', '{baseUrl}/api/v1', { components: { schemas: { Pet: { type: 'object' } } } }),
                petSpec('v2', '{baseUrl}/api/v2', { components: { schemas: { Pet: { type: 'string' } } } }),
            ]),
        ).toThrow('components.schemas.Pet conflict');
    });

    it('throws on a tag conflict', () => {
        expect(() =>
            mergeSpecs([
                petSpec('v1', '{baseUrl}/api/v1', { tags: [{ name: 'Pet', description: 'one' }] }),
                petSpec('v2', '{baseUrl}/api/v2', { tags: [{ name: 'Pet', description: 'two' }] }),
            ]),
        ).toThrow('tags.Pet conflict');
    });

    it('throws when no specs are provided', () => {
        expect(() => mergeSpecs([])).toThrow('No OpenAPI specs provided');
    });
});
