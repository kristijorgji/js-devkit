import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { FIXTURE_APP_ROOT } from '../__fixtures__/test-config.js';

import { detectAdapter } from './detect.js';

describe('detectAdapter', () => {
    it('selects next15 when prerender-manifest exists without diagnostics', () => {
        const adapter = detectAdapter(join(FIXTURE_APP_ROOT, 'next15/.next'));
        expect(adapter.id).toBe('next15');
        expect(adapter.capabilities.prerenderManifest).toBe(true);
        expect(adapter.loadPrerenderInfo(join(FIXTURE_APP_ROOT, 'next15/.next'))?.routes['/en']).toBeTruthy();
    });

    it('selects next16 when diagnostics dir is present', () => {
        const adapter = detectAdapter(join(FIXTURE_APP_ROOT, 'next16/.next'));
        expect(adapter.id).toBe('next16');
        expect(adapter.capabilities.prerenderManifest).toBe(true);
    });

    it('degrades when no build output exists', () => {
        const adapter = detectAdapter(join(FIXTURE_APP_ROOT, 'missing-dist'));
        expect(adapter.capabilities.prerenderManifest).toBe(false);
        expect(adapter.loadPrerenderInfo(join(FIXTURE_APP_ROOT, 'missing-dist'))).toBeNull();
    });
});
