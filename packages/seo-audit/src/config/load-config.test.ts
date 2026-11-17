import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { findConfigFile, loadConfig } from './load-config.js';

describe('loadConfig', () => {
    it('applies defaults when no config file exists', async () => {
        const dir = mkdtempSync(join(tmpdir(), 'seo-audit-noconfig-'));
        try {
            expect(findConfigFile(dir)).toBeNull();
            const loaded = await loadConfig(dir);
            expect(loaded.sitemaps.publicPath).toBe('/sitemap.xml');
            expect(loaded.userAgent).toContain('kj-seo-audit');
        } finally {
            rmSync(dir, { recursive: true, force: true });
        }
    });

    it('loads a parent-directory .mjs config', async () => {
        const dir = mkdtempSync(join(tmpdir(), 'seo-audit-mjs-'));
        const nested = join(dir, 'apps', 'web');
        mkdirSync(nested, { recursive: true });
        writeFileSync(
            join(dir, 'seo-audit.config.mjs'),
            'export default { fetch: { userAgent: "demo-agent/1.0" } };\n',
        );
        try {
            expect(findConfigFile(nested)).toContain('seo-audit.config.mjs');
            const loaded = await loadConfig(nested);
            expect(loaded.userAgent).toBe('demo-agent/1.0');
        } finally {
            rmSync(dir, { recursive: true, force: true });
        }
    });
});
