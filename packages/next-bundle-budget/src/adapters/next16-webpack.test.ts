import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { next16WebpackAdapter } from './next16-webpack.js';

const fixture = join(dirname(fileURLToPath(import.meta.url)), '__fixtures__/next16-webpack');

describe('next16WebpackAdapter', () => {
    it('is degraded: no per-route chunks', () => {
        expect(next16WebpackAdapter.capabilities.perRouteChunks).toBe(false);
        expect(next16WebpackAdapter.listPageOwnedChunks(fixture)).toEqual([]);
    });
});
