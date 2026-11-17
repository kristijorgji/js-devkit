import { XMLParser } from 'fast-xml-parser';

import type { SitemapUrlRecord } from './types.js';

const parser = new XMLParser({
    ignoreAttributes: true,
    trimValues: true,
    isArray: (tagName) => tagName === 'url' || tagName === 'sitemap',
});

function asString(value: unknown): string | undefined {
    return typeof value === 'string' && value.length > 0 ? value : undefined;
}

export function detectSitemapKind(xml: string): 'urlset' | 'sitemapindex' | undefined {
    if (/<sitemapindex[\s>]/i.test(xml)) return 'sitemapindex';
    if (/<urlset[\s>]/i.test(xml)) return 'urlset';
    return undefined;
}

export function extractSitemapLocs(xml: string): SitemapUrlRecord[] {
    const kind = detectSitemapKind(xml);
    const parsed: unknown = parser.parse(xml);
    if (kind === 'sitemapindex') {
        const index = (parsed as { sitemapindex?: { sitemap?: { loc?: unknown; lastmod?: unknown }[] } }).sitemapindex;
        return (index?.sitemap ?? []).flatMap((row) => {
            const loc = asString(row.loc);
            return loc ? [{ loc, lastmod: asString(row.lastmod) }] : [];
        });
    }
    const urlset = (parsed as { urlset?: { url?: { loc?: unknown; lastmod?: unknown }[] } }).urlset;
    return (urlset?.url ?? []).flatMap((row) => {
        const loc = asString(row.loc);
        return loc ? [{ loc, lastmod: asString(row.lastmod) }] : [];
    });
}
