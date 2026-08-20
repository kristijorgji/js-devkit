import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { next15WebpackAdapter } from './next15-webpack.js';

const fixture = join(dirname(fileURLToPath(import.meta.url)), '__fixtures__/next15');

describe('next15WebpackAdapter', () => {
    it('lists webpack-named chunk groups from the production fixture', () => {
        const groups = next15WebpackAdapter.listChunkGroups(fixture);
        const ids = groups.map((group) => group.id);
        expect(ids).toContain('framework');
        expect(ids).toContain('main');
        expect(ids).toContain('polyfills');
        expect(ids).toContain('webpackRuntime');
        expect(ids).toContain('asyncChunks');
        expect(ids).toContain('appRouteChunks');
    });

    it('lists page-owned chunks from app-build-manifest.json', () => {
        const pages = next15WebpackAdapter.listPageOwnedChunks(fixture);
        expect(pages.length).toBeGreaterThan(0);
        expect(pages.some((page) => page.manifestKey.endsWith('/page'))).toBe(true);
    });
});
