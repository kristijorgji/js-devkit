// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { collectSeedUrls, crawl, maskSecret } from './sources.js';
import type { FetchedPage } from './types.js';

const ORIGIN = 'https://www.example.com';

function urlset(locs: string[]): string {
    return `<urlset>${locs.map((loc) => `<url><loc>${loc}</loc></url>`).join('')}</urlset>`;
}

function sitemapIndex(locs: string[]): string {
    return `<sitemapindex>${locs.map((loc) => `<sitemap><loc>${loc}</loc></sitemap>`).join('')}</sitemapindex>`;
}

function htmlPage(links: string[]): string {
    return `<html><body>${links.map((href) => `<a href="${href}">x</a>`).join('')}</body></html>`;
}

function fetched(url: string, links: string[]): FetchedPage {
    return {
        url,
        status: 200,
        location: null,
        robotsHeader: null,
        contentType: 'text/html',
        html: htmlPage(links),
        durationMs: 1,
    };
}

describe('collectSeedUrls', () => {
    it('keeps public membership when the secret sitemap repeats a URL', async () => {
        const secret = 'super-secret-token';
        const child = `${ORIGIN}/sitemaps/${secret}/en/properties/1.xml`;
        const bodies = new Map<string, string>([
            [`${ORIGIN}/sitemap.xml`, urlset([`${ORIGIN}/en`, `${ORIGIN}/en/properties`])],
            [`${ORIGIN}/sitemaps/${secret}/index.xml`, sitemapIndex([child])],
            [child, urlset([`${ORIGIN}/en`, `${ORIGIN}/en/properties/x`])],
        ]);
        const collected = await collectSeedUrls({
            baseUrl: ORIGIN,
            secret,
            fetchImpl: async (url) => new Response(bodies.get(String(url)) ?? '', { status: 200 }),
            userAgent: 'test-agent',
            publicPath: '/sitemap.xml',
            secretIndexPath: (token) => `/sitemaps/${token}/index.xml`,
        });
        expect(collected.seeds.get(`${ORIGIN}/en`)).toBe('public');
        expect(collected.seeds.get(`${ORIGIN}/en/properties/x`)).toBe('secret');
        expect([...collected.seeds.keys()].join(' ')).not.toContain(secret);
        expect(collected.seedIssues).toEqual([]);
    });

    it('masks the secret in failure messages', async () => {
        const secret = 'super-secret-token';
        const fetchImpl: typeof fetch = async (input) => {
            const url = String(input);
            if (url.includes(secret)) {
                throw new Error(`boom ${url}`);
            }
            return new Response(urlset([`${ORIGIN}/en`]), { status: 200 });
        };
        const input = {
            baseUrl: ORIGIN,
            secret,
            fetchImpl,
            userAgent: 'test-agent',
            publicPath: '/sitemap.xml',
            secretIndexPath: (token: string) => `/sitemaps/${token}/index.xml`,
        };
        await expect(collectSeedUrls(input)).rejects.toThrow(/boom/);
        try {
            await collectSeedUrls(input);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            expect(message).not.toContain(secret);
            expect(message).toContain('***');
            expect(maskSecret(message, secret)).toBe(message);
        }
    });

    it('skips a 5xx secret child sitemap and keeps other seeds', async () => {
        const secret = 'super-secret-token';
        const okChild = `${ORIGIN}/sitemaps/${secret}/en/cities/1.xml`;
        const badChild = `${ORIGIN}/sitemaps/${secret}/en/agencies/1.xml`;
        const fetchImpl: typeof fetch = async (input) => {
            const url = String(input);
            if (url === `${ORIGIN}/sitemap.xml`) {
                return new Response(urlset([`${ORIGIN}/en`]), { status: 200 });
            }
            if (url === `${ORIGIN}/sitemaps/${secret}/index.xml`) {
                return new Response(sitemapIndex([okChild, badChild]), { status: 200 });
            }
            if (url === okChild) {
                return new Response(urlset([`${ORIGIN}/en/country`]), { status: 200 });
            }
            if (url === badChild) {
                return new Response('gateway timeout', { status: 504 });
            }
            return new Response('', { status: 404 });
        };
        const collected = await collectSeedUrls({
            baseUrl: ORIGIN,
            secret,
            fetchImpl,
            userAgent: 'test-agent',
            publicPath: '/sitemap.xml',
            secretIndexPath: (token) => `/sitemaps/${token}/index.xml`,
        });
        expect(collected.seeds.get(`${ORIGIN}/en`)).toBe('public');
        expect(collected.seeds.get(`${ORIGIN}/en/country`)).toBe('secret');
        expect(collected.seedIssues).toHaveLength(1);
        expect(collected.seedIssues[0]?.status).toBe(504);
        expect(collected.seedIssues[0]?.url).not.toContain(secret);
        expect(collected.seedIssues[0]?.message).not.toContain(secret);
        expect(JSON.stringify(collected)).not.toContain(secret);
    });
});

describe('crawl', () => {
    it('respects max urls, depth, robots, extensions, and the query cap', async () => {
        const seeds = new Map<string, 'public' | 'secret' | null>([[`${ORIGIN}/en`, 'public']]);
        const links: Record<string, string[]> = {
            [`${ORIGIN}/en`]: [
                `${ORIGIN}/en/a`,
                `${ORIGIN}/en/hidden`,
                `${ORIGIN}/en/photo.png`,
                `${ORIGIN}/en/properties?page=1`,
                `${ORIGIN}/en/properties?page=2`,
                `${ORIGIN}/en/properties?page=3`,
                `${ORIGIN}/en/properties?page=4`,
            ],
            [`${ORIGIN}/en/a`]: [`${ORIGIN}/en/b`],
        };
        const crawled = await crawl({
            baseUrl: ORIGIN,
            seeds,
            locales: ['en'],
            maxUrls: 20,
            crawlDepth: 1,
            robotsBody: 'User-agent: *\nDisallow: /en/hidden\n',
            fetchOne: async (url) => fetched(url, links[url] ?? []),
            skipPathPrefixes: ['/api', '/_next'],
            skipExtensions: ['png', 'jpg', 'webp', 'avif', 'svg', 'pdf', 'xml', 'txt', 'ico'],
            queryCapPerPath: 3,
            buildAssetMarker: '/_next/static/',
        });
        const urls: string[] = [...crawled.keys()];
        expect(urls).toContain(`${ORIGIN}/en`);
        expect(urls).toContain(`${ORIGIN}/en/a`);
        expect(urls).not.toContain(`${ORIGIN}/en/b`);
        expect(urls).not.toContain(`${ORIGIN}/en/hidden`);
        expect(urls).not.toContain(`${ORIGIN}/en/photo.png`);
        expect(urls.filter((url) => url.includes('?page='))).toHaveLength(3);
        expect(crawled.get(`${ORIGIN}/en`)?.discoveredVia).toBe('sitemap');
        expect(crawled.get(`${ORIGIN}/en/a`)?.discoveredVia).toBe('crawl');
        expect(crawled.get(`${ORIGIN}/en`)?.inSitemap).toBe('public');
    });

    it('stops at maxUrls', async () => {
        const seeds = new Map<string, 'public'>([
            [`${ORIGIN}/en`, 'public'],
            [`${ORIGIN}/en/a`, 'public'],
            [`${ORIGIN}/en/b`, 'public'],
            [`${ORIGIN}/en/c`, 'public'],
        ]);
        const crawled = await crawl({
            baseUrl: ORIGIN,
            seeds,
            locales: [],
            maxUrls: 2,
            crawlDepth: 0,
            robotsBody: '',
            fetchOne: async (url) => fetched(url, []),
            skipPathPrefixes: ['/api', '/_next'],
            skipExtensions: ['png', 'jpg', 'webp', 'avif', 'svg', 'pdf', 'xml', 'txt', 'ico'],
            queryCapPerPath: 3,
            buildAssetMarker: '/_next/static/',
        });
        expect(crawled.size).toBe(2);
    });
});
