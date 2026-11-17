// @vitest-environment node
import { describe, expect, it } from 'vitest';

import type { SeoCheckResult } from './types.js';
import { collectPageLocsFromSitemap, type FetchSitemapBody } from './walk-sitemaps.js';

const ORIGIN = 'https://www.example.com';
const SECRET = 'test-sitemap-secret-16';

function urlset(locs: string[]): string {
    return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${locs
        .map((loc) => `<url><loc>${loc}</loc></url>`)
        .join('')}</urlset>`;
}

function sitemapIndex(locs: string[]): string {
    return `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${locs
        .map((loc) => `<sitemap><loc>${loc}</loc></sitemap>`)
        .join('')}</sitemapindex>`;
}

describe('collectPageLocsFromSitemap', () => {
    it('descends locale indexes and stops at urlset page locs', async () => {
        const global = `${ORIGIN}/sitemaps/${SECRET}/index.xml`;
        const localeIndex = `${ORIGIN}/sitemaps/${SECRET}/en/index.xml`;
        const staticShard = `${ORIGIN}/sitemaps/${SECRET}/en/static/1.xml`;
        const page = `${ORIGIN}/en`;
        const bodies = new Map<string, string>([
            [global, sitemapIndex([localeIndex])],
            [localeIndex, sitemapIndex([staticShard])],
            [staticShard, urlset([page])],
            [page, '<html></html>'],
        ]);
        const fetched: string[] = [];
        const fetchSitemap: FetchSitemapBody = async (url) => {
            fetched.push(url);
            return {
                status: 200,
                contentType: 'application/xml',
                body: bodies.get(url) ?? '',
            };
        };
        const results: SeoCheckResult[] = [];
        const locs = await collectPageLocsFromSitemap(global, ORIGIN, results, fetchSitemap);
        expect(locs.map((row) => row.loc)).toEqual([page]);
        expect(fetched).toEqual([global, localeIndex, staticShard]);
    });
});
