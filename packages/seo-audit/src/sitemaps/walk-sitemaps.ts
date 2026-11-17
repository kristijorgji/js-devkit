import { checkSitemapLimits, checkSitemapLocs, parseSitemapXml, validateSitemapSchema } from './sitemap-checks.js';
import { checkFailed, type SeoCheckResult, type SitemapUrlRecord } from './types.js';

export interface FetchedSitemapBody {
    status: number;
    contentType: string | null;
    body: string;
}

export type FetchSitemapBody = (url: string) => Promise<FetchedSitemapBody>;

interface WalkSitemapsOptions {
    seen?: Set<string>;
    onHttpError?: (url: string, fetched: FetchedSitemapBody) => void | Promise<void>;
    onParseError?: (url: string, message: string) => void | Promise<void>;
    onDocument?: (args: {
        url: string;
        kind: 'urlset' | 'sitemapindex';
        urls: SitemapUrlRecord[];
        body: string;
    }) => void | Promise<void>;
}

export async function walkSitemaps(
    url: string,
    fetchSitemap: FetchSitemapBody,
    options: WalkSitemapsOptions = {},
): Promise<SitemapUrlRecord[]> {
    const seen = options.seen ?? new Set<string>();
    if (seen.has(url)) return [];
    seen.add(url);

    const fetched = await fetchSitemap(url);
    if (fetched.status !== 200) {
        await options.onHttpError?.(url, fetched);
        return [];
    }

    let parsed: { kind: 'urlset' | 'sitemapindex'; urls: SitemapUrlRecord[] };
    try {
        parsed = parseSitemapXml(fetched.body);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        await options.onParseError?.(url, message);
        return [];
    }

    await options.onDocument?.({ url, kind: parsed.kind, urls: parsed.urls, body: fetched.body });

    if (parsed.kind === 'urlset') {
        return parsed.urls;
    }

    const pageLocs: SitemapUrlRecord[] = [];
    for (const child of parsed.urls) {
        pageLocs.push(...(await walkSitemaps(child.loc, fetchSitemap, { ...options, seen })));
    }
    return pageLocs;
}

export async function collectPageLocsFromSitemap(
    url: string,
    origin: string,
    results: SeoCheckResult[],
    fetchSitemap: FetchSitemapBody,
    seen = new Set<string>(),
): Promise<SitemapUrlRecord[]> {
    return walkSitemaps(url, fetchSitemap, {
        seen,
        onHttpError: (documentUrl, fetched) => {
            results.push({
                name: `sitemap:${documentUrl}`,
                ok: false,
                messages: [`HTTP ${fetched.status}`],
            });
        },
        onParseError: (documentUrl, message) => {
            results.push(checkFailed(`sitemap-parse:${documentUrl}`, [message]));
        },
        onDocument: async ({ urls, body }) => {
            results.push(await validateSitemapSchema(body));
            results.push(checkSitemapLimits(body, urls));
            results.push(checkSitemapLocs(urls, origin));
        },
    });
}
