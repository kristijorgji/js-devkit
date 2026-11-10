import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { next16TurbopackAdapter } from './next16-turbopack.js';

const fixtures = join(dirname(fileURLToPath(import.meta.url)), '__fixtures__');
const appRouterFixture = join(fixtures, 'next16-turbopack');
const pagesRouterFixture = join(fixtures, 'next16-turbopack-pages');

describe('next16TurbopackAdapter', () => {
    it('reads per-route chunks from route-bundle-stats.json', () => {
        const pages = next16TurbopackAdapter.listPageOwnedChunks(appRouterFixture);
        expect(pages[0]?.normalizedPath).toBe('/[locale]/posts');
        expect(pages[0]?.chunkPaths).toContain('static/chunks/page-posts.js');
    });

    it('reads pages-router chunks from build-manifest.json even when route-bundle-stats.json lists first-load files', () => {
        const pages = next16TurbopackAdapter.listPageOwnedChunks(pagesRouterFixture);
        const home = pages.find((page) => page.manifestKey === '/');
        const login = pages.find((page) => page.manifestKey === '/login');

        expect(pages.map((page) => page.manifestKey)).toEqual(['/', '/login']);
        expect(home?.chunkPaths).toEqual(['static/chunks/page-index.js']);
        expect(login?.chunkPaths).toEqual(['static/chunks/page-login.js']);
    });

    it('falls back shared vendor to /_app files when rootMainFiles is empty', () => {
        expect(next16TurbopackAdapter.listSharedVendorChunks(pagesRouterFixture).map((chunk) => chunk.filename)).toEqual(
            ['aaaa-shared.js'],
        );
        const sharedVendor = next16TurbopackAdapter
            .listChunkGroups(pagesRouterFixture)
            .find((group) => group.id === 'sharedVendor1');
        expect(sharedVendor?.paths).toEqual(['.next/static/chunks/aaaa-shared.js']);
    });
});
