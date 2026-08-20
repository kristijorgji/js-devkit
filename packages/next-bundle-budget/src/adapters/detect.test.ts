import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { detectAdapter } from './detect.js';

const fixtures = join(dirname(fileURLToPath(import.meta.url)), '__fixtures__');

describe('detectAdapter', () => {
    it('detects next15-webpack from app-build-manifest.json', () => {
        expect(detectAdapter(join(fixtures, 'next15')).id).toBe('next15-webpack');
    });

    it('detects next16-turbopack from route-bundle-stats.json', () => {
        expect(detectAdapter(join(fixtures, 'next16-turbopack')).id).toBe('next16-turbopack');
    });

    it('detects next16-webpack when only build-manifest.json is present', () => {
        expect(detectAdapter(join(fixtures, 'next16-webpack')).id).toBe('next16-webpack');
    });
});
