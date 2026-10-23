import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { pagesWebpackAdapter } from './pages-webpack.js';

const fixture = join(dirname(fileURLToPath(import.meta.url)), '__fixtures__/pages-webpack');

describe('pagesWebpackAdapter', () => {
    it('keeps page-owned js and drops the app shell', () => {
        const pages = pagesWebpackAdapter.listPageOwnedChunks(fixture);
        const home = pages.find((page) => page.manifestKey === '/');
        const login = pages.find((page) => page.manifestKey === '/login');

        expect(pages.map((page) => page.manifestKey)).toEqual(['/', '/login']);
        expect(home?.chunkPaths).toEqual(['static/chunks/pages/index-hash.js']);
        expect(login?.chunkPaths).toEqual(['static/chunks/pages/login-hash.js']);
    });

    it('points app route chunks at the pages directory and ranks shared vendor files', () => {
        const groups = pagesWebpackAdapter.listChunkGroups(fixture);
        const appRoutes = groups.find((group) => group.id === 'appRouteChunks');
        const vendor = groups.find((group) => group.id === 'sharedVendor1');

        expect(appRoutes?.paths).toEqual(['.next/static/chunks/pages/**/*.js']);
        expect(vendor?.paths).toEqual(['.next/static/chunks/999-*.js']);
        expect(pagesWebpackAdapter.listSharedVendorChunks(fixture).map((chunk) => chunk.filename)).toEqual([
            '999-vendor.js',
        ]);
    });
});
