// @vitest-environment node
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { resolveSeoAuditConfig } from './resolve-config.js';

describe('resolveSeoAuditConfig', () => {
    it('applies every default', () => {
        const rootDir = '/tmp/seo-audit-root';
        const resolved = resolveSeoAuditConfig({}, rootDir);
        expect(resolved.rootDir).toBe(rootDir);
        expect(resolved.secretEnv).toBeUndefined();
        expect(resolved.locales).toEqual({ supported: [], indexable: [], default: undefined });
        expect(resolved.sitemaps.publicPath).toBe('/sitemap.xml');
        expect(resolved.sitemaps.secretIndexPath).toBeUndefined();
        expect(resolved.robots).toEqual({
            userAgent: 'Googlebot',
            forbiddenSubstrings: [],
            mustAllow: ['/'],
            mustDisallow: [],
        });
        expect(resolved.notFoundProbes).toEqual(['/__kj-seo-404-probe__/x']);
        expect(resolved.routesFile).toBeUndefined();
        expect(resolved.userAgent).toBe('kj-seo-audit/1.0 (+https://github.com/kristijorgji/js-devkit)');
        expect(resolved.crawl).toEqual({
            skipPathPrefixes: ['/api', '/_next'],
            skipExtensions: ['png', 'jpg', 'webp', 'avif', 'svg', 'pdf', 'xml', 'txt', 'ico'],
            queryCapPerPath: 3,
        });
        expect(resolved.rules.thresholds).toEqual({
            titleMin: 30,
            titleMax: 65,
            descriptionMin: 70,
            descriptionMax: 160,
        });
        expect(resolved.rules.overrides).toEqual({});
        expect(resolved.rules.requiredOpenGraph).toEqual([
            'og:title',
            'og:description',
            'og:url',
            'og:image',
            'og:type',
            'og:site_name',
        ]);
        expect(resolved.rules.buildAssetMarker).toBe('/_next/static/');
        expect(resolved.reportOutDir).toBe(path.resolve(rootDir, '.cache/seo-audit'));
    });

    it('reads locales from the routes file when they are not configured', () => {
        const dir = mkdtempSync(path.join(tmpdir(), 'seo-audit-config-'));
        mkdirSync(path.join(dir, 'docs'));
        writeFileSync(
            path.join(dir, 'docs/routes.json'),
            JSON.stringify({ locales: ['en', 'de'], appPages: [] }),
        );
        const resolved = resolveSeoAuditConfig({ routes: { file: 'docs/routes.json' } }, dir);
        expect(resolved.locales.supported).toEqual(['en', 'de']);
        expect(resolved.locales.indexable).toEqual(['en', 'de']);
        expect(resolved.locales.default).toBe('en');
        expect(resolved.routesFile).toBe(path.join(dir, 'docs/routes.json'));
    });
});
