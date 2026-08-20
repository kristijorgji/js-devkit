import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { FIXTURE_APP_ROOT } from '../__fixtures__/test-config.js';
import { formatPageRendering } from '../parse/parse-route-source.js';

import { discoverAppPages } from './discover-app-pages.js';
import { discoverInfraRoutes } from './discover-infra-routes.js';

const APP_DIR = join(FIXTURE_APP_ROOT, 'app');
const PUBLIC_DIR = join(FIXTURE_APP_ROOT, 'public');

describe('discoverAppPages', () => {
    it('walks the synthetic app tree and classifies rendering', () => {
        const pages = discoverAppPages(APP_DIR);
        const byPath = Object.fromEntries(pages.map((page) => [page.sourcePath, page]));

        expect(Object.keys(byPath)).toEqual(
            expect.arrayContaining([
                '[locale]/page.tsx',
                '[locale]/posts/page.tsx',
                '[locale]/posts/[slug]/page.tsx',
                '[locale]/(auth)/login/page.tsx',
                '[locale]/(dashboard)/dashboard/page.tsx',
            ]),
        );

        expect(formatPageRendering(byPath['[locale]/page.tsx']!.declared)).toBe('Build-time SSG');
        expect(formatPageRendering(byPath['[locale]/posts/page.tsx']!.declared)).toBe('Dynamic (searchParams)');
        expect(formatPageRendering(byPath['[locale]/posts/[slug]/page.tsx']!.declared)).toBe(
            'Build-time SSG + ISR (3600s)',
        );
        expect(formatPageRendering(byPath['[locale]/(dashboard)/dashboard/page.tsx']!.parsed)).toBe(
            'Dynamic (cookies/headers)',
        );
    });
});

describe('discoverInfraRoutes', () => {
    it('finds metadata, handlers, icons, OG images, and public files', () => {
        const infra = discoverInfraRoutes(APP_DIR, PUBLIC_DIR, FIXTURE_APP_ROOT, {
            localeParam: 'locale',
            ignorePublicPaths: [],
        });
        const patterns = infra.map((route) => route.urlPattern);
        expect(patterns).toEqual(
            expect.arrayContaining([
                '/robots.txt',
                '/sitemap.xml',
                '/{locale}/opengraph-image',
                '/icon',
                '/api/health',
                '/favicon.ico',
            ]),
        );
        const health = infra.find((route) => route.urlPattern === '/api/health');
        expect(health?.methods).toEqual(['GET', 'POST']);
    });
});
