import { describe, expect, it } from 'vitest';

import { fixtureConfig } from '../__fixtures__/test-config.js';

import { generatePostmanCollection } from './generate.js';
import { normalizePostmanCollection } from './snapshot.js';

describe('generatePostmanCollection', () => {
    it('emits a sanitized collection with parameterized host and token paths', async () => {
        const collection = await generatePostmanCollection(fixtureConfig());
        const snapshot = normalizePostmanCollection(collection);

        expect(snapshot.variables.map((variable) => variable.key)).toEqual([
            'accessToken',
            'apiKey',
            'baseApiUrl',
            'refreshToken',
            'testEmail',
            'testPassword',
        ]);
        expect(snapshot.variables.find((variable) => variable.key === 'baseApiUrl')?.value).toBe(
            'http://localhost:3000',
        );

        const login = snapshot.requests.find((request) => request.path.endsWith('auth/login'));
        expect(login?.test.some((line) => line.includes('json?.data?.tokens?.accessToken'))).toBe(true);
        expect(login?.test.join('\n')).not.toMatch(/prona/i);

        const listPosts = snapshot.requests.find(
            (request) => request.method === 'GET' && request.path.endsWith('posts'),
        );
        expect(listPosts?.prerequest.join('\n')).toContain('Authorization');
        expect(listPosts?.prerequest.join('\n')).toContain('X-API-Key');

        const serialized = JSON.stringify(collection);
        expect(serialized).not.toMatch(/prona365|prona|immobilien/i);
    });
});
