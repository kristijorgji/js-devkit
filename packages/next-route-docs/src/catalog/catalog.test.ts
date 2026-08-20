import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { fixtureConfig } from '../__fixtures__/test-config.js';

import { auditCatalog } from './audit.js';
import { buildRouteCatalog } from './build-catalog.js';
import { renderRoutesHtml } from './render-html.js';
import { serializeRouteCatalog } from './render-json.js';
import { renderRoutesMarkdown } from './render-markdown.js';

describe('buildRouteCatalog', () => {
    it('applies hooks and includes locale columns when locales are set', () => {
        const catalog = buildRouteCatalog(fixtureConfig());
        const home = catalog.appPages.find((row) => row.routeName === 'home');
        const posts = catalog.appPages.find((row) => row.routeName === 'posts');
        const dashboard = catalog.appPages.find((row) => row.routeName === 'dashboard');
        expect(home?.description).toBe('Marketing home');
        expect(posts?.pathsByLocale).toEqual({ en: '/posts', de: '/beitraege' });
        expect(dashboard?.auth).toBe('JWT');
        expect(catalog.infraRoutes.some((row) => row.urlPattern === '/{locale}/opengraph-image')).toBe(true);
    });

    it('omits locale columns when locales is empty', () => {
        const config = fixtureConfig({ locales: [] });
        const markdown = renderRoutesMarkdown(buildRouteCatalog(config), config);
        expect(markdown).not.toContain('Path (en)');
        expect(markdown).not.toContain('### Localized paths');
        expect(markdown).toContain('# Routes');
    });

    it('escapes viewer titles and embeds catalog JSON', () => {
        const config = fixtureConfig({ viewerTitle: 'Routes <script>' });
        const html = renderRoutesHtml(buildRouteCatalog(config), config);
        expect(html).toContain('<title>Routes &lt;script&gt;</title>');
        expect(html).toContain('"routeName":"home"');
        expect(html).not.toContain('<!-- VIEWER_DATA -->');
    });

    it('serializes JSON with locales', () => {
        const config = fixtureConfig();
        const json = JSON.parse(serializeRouteCatalog(buildRouteCatalog(config), config)) as {
            locales: string[];
        };
        expect(json.locales).toEqual(['en', 'de']);
    });
});

describe('auditCatalog', () => {
    it('reports declared-vs-built mismatches', () => {
        const result = auditCatalog(fixtureConfig());
        expect(result.skipped).toBe(false);
        expect(result.mismatches.some((line) => line.includes('home'))).toBe(false);
    });

    it('skips when the adapter cannot read a manifest', () => {
        const result = auditCatalog(fixtureConfig({ distDir: join(fixtureConfig().appRoot, 'missing-dist') }));
        expect(result.skipped).toBe(true);
        if (result.skipped) {
            expect(result.reason).toMatch(/not found|cannot read/);
        }
    });
});
