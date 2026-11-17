import { robotsParser } from '../robots-parser.js';
import { type FetchSitemapBody, walkSitemaps } from '../sitemaps/walk-sitemaps.js';
import { extractSitemapLocs } from '../sitemaps/xml-locs.js';

import { parsePage } from './parse-page.js';
import type { FetchedPage, ParsedPage, SitemapMembership } from './types.js';

export interface CrawledRecord {
    fetched: FetchedPage;
    parsed?: ParsedPage;
    discoveredVia: 'sitemap' | 'crawl';
    depth: number;
    inSitemap: SitemapMembership;
}

export function maskSecret(value: string, secret: string | undefined): string {
    if (!secret) {
        return value;
    }
    return value.split(secret).join('***');
}

function normalizeKey(raw: string, baseUrl: string): string | undefined {
    try {
        const url = new URL(raw, baseUrl);
        if (url.origin !== new URL(baseUrl).origin) {
            return undefined;
        }
        url.hash = '';
        return url.toString();
    } catch {
        return undefined;
    }
}

async function fetchBody(url: string, fetchImpl: typeof fetch, userAgent: string, secret?: string): Promise<string> {
    try {
        const response = await fetchImpl(url, {
            redirect: 'manual',
            headers: { 'user-agent': userAgent, accept: 'application/xml,text/xml,text/plain' },
        });
        if (response.status !== 200) {
            throw new Error(`fetch failed with ${response.status} for ${url}`);
        }
        return await response.text();
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(maskSecret(message, secret));
    }
}

export interface SeedFetchIssue {
    url: string;
    status: number;
    message: string;
}

interface SeedCollection {
    seeds: Map<string, SitemapMembership>;
    seedIssues: SeedFetchIssue[];
}

export async function collectSeedUrls(input: {
    baseUrl: string;
    secret?: string;
    fetchImpl?: typeof fetch;
    userAgent: string;
    publicPath: string;
    secretIndexPath?: (secret: string) => string;
}): Promise<SeedCollection> {
    const fetchImpl = input.fetchImpl ?? fetch;
    const seeds = new Map<string, SitemapMembership>();
    const seedIssues: SeedFetchIssue[] = [];
    const add = (loc: string, membership: SitemapMembership): void => {
        const key = normalizeKey(loc, input.baseUrl);
        if (!key || seeds.has(key)) {
            return;
        }
        seeds.set(key, membership);
    };

    const publicXml = await fetchBody(
        `${input.baseUrl}${input.publicPath}`,
        fetchImpl,
        input.userAgent,
        input.secret,
    );
    for (const row of extractSitemapLocs(publicXml)) {
        add(row.loc, 'public');
    }
    if (!input.secret || !input.secretIndexPath) {
        return { seeds, seedIssues };
    }

    const fetchSitemap: FetchSitemapBody = async (url) => {
        try {
            const response = await fetchImpl(url, {
                redirect: 'manual',
                headers: { 'user-agent': input.userAgent, accept: 'application/xml,text/xml,text/plain' },
            });
            return {
                status: response.status,
                contentType: response.headers.get('content-type'),
                body: await response.text(),
            };
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            throw new Error(maskSecret(message, input.secret));
        }
    };

    await walkSitemaps(`${input.baseUrl}${input.secretIndexPath(input.secret)}`, fetchSitemap, {
        onHttpError: (url, fetched) => {
            seedIssues.push({
                url: maskSecret(url, input.secret),
                status: fetched.status,
                message: maskSecret(`fetch failed with ${fetched.status} for ${url}`, input.secret),
            });
        },
        onParseError: (url, message) => {
            seedIssues.push({
                url: maskSecret(url, input.secret),
                status: 0,
                message: maskSecret(message, input.secret),
            });
        },
        onDocument: ({ kind, urls }) => {
            if (kind !== 'urlset') return;
            for (const row of urls) {
                add(row.loc, 'secret');
            }
        },
    });
    return { seeds, seedIssues };
}

function isSkippedPath(url: URL, prefixes: readonly string[], extRegex: RegExp): boolean {
    const { pathname } = url;
    for (const prefix of prefixes) {
        if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
            return true;
        }
    }
    return extRegex.test(pathname);
}

export async function crawl(input: {
    baseUrl: string;
    seeds: Map<string, SitemapMembership>;
    locales: readonly string[];
    maxUrls: number;
    crawlDepth: number;
    robotsBody: string;
    fetchOne: (url: string) => Promise<FetchedPage>;
    skipPathPrefixes: string[];
    skipExtensions: string[];
    queryCapPerPath: number;
    buildAssetMarker: string | false;
}): Promise<Map<string, CrawledRecord>> {
    const origin = new URL(input.baseUrl).origin;
    const robots = robotsParser(`${origin}/robots.txt`, input.robotsBody);
    const queue: { url: string; depth: number; via: 'sitemap' | 'crawl' }[] = [];
    const seen = new Set<string>();
    const queryCount = new Map<string, number>();
    const extRegex = new RegExp(`\\.(${input.skipExtensions.join('|')})$`, 'i');

    const enqueue = (raw: string, depth: number): void => {
        const url = normalizeKey(raw, input.baseUrl);
        if (!url || depth > input.crawlDepth || seen.has(url)) {
            return;
        }
        const parsed = new URL(url);
        if (isSkippedPath(parsed, input.skipPathPrefixes, extRegex) || robots.isAllowed(url, '*') === false) {
            return;
        }
        if (parsed.search) {
            const count = queryCount.get(parsed.pathname) ?? 0;
            if (count >= input.queryCapPerPath) {
                return;
            }
            queryCount.set(parsed.pathname, count + 1);
        }
        seen.add(url);
        queue.push({ url, depth, via: input.seeds.has(url) ? 'sitemap' : 'crawl' });
    };

    for (const seed of input.seeds.keys()) {
        enqueue(seed, 0);
    }
    for (const locale of input.locales) {
        enqueue(`${origin}/${locale}`, 0);
    }

    const result = new Map<string, CrawledRecord>();
    while (queue.length > 0 && result.size < input.maxUrls) {
        const batch = queue.splice(0, input.maxUrls - result.size);
        const fetched = await Promise.all(batch.map(async (item) => ({ item, page: await input.fetchOne(item.url) })));
        for (const { item, page } of fetched) {
            const isHtml = page.status === 200 && (page.contentType ?? '').includes('text/html');
            const parsed = isHtml ? parsePage(page.html, page.url, input.buildAssetMarker) : undefined;
            if (parsed) {
                for (const link of parsed.links) {
                    enqueue(link, item.depth + 1);
                }
            }
            result.set(item.url, {
                fetched: page,
                parsed,
                discoveredVia: item.via,
                depth: item.depth,
                inSitemap: input.seeds.get(item.url) ?? null,
            });
        }
    }
    return result;
}
