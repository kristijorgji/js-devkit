import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { next16TurbopackAdapter } from './next16-turbopack.js';

const fixture = join(dirname(fileURLToPath(import.meta.url)), '__fixtures__/next16-turbopack');

describe('next16TurbopackAdapter', () => {
    it('reads per-route chunks from route-bundle-stats.json', () => {
        const pages = next16TurbopackAdapter.listPageOwnedChunks(fixture);
        expect(pages[0]?.normalizedPath).toBe('/[locale]/posts');
        expect(pages[0]?.chunkPaths).toContain('static/chunks/page-posts.js');
    });
});
