import { load } from 'cheerio';

import type { ParsedPage } from './types.js';

function attr(value: string | undefined): string | undefined {
    const trimmed = value?.trim();
    return trimmed ? trimmed : undefined;
}

export function hasNoindex(metaRobots: string | undefined, robotsHeader: string | undefined): boolean {
    const meta = metaRobots?.toLowerCase() ?? '';
    const header = robotsHeader?.toLowerCase() ?? '';
    return meta.includes('noindex') || header.includes('noindex');
}

export function parsePage(
    html: string,
    pageUrl: string,
    buildAssetMarker: string | false = '/_next/static/',
): ParsedPage {
    const $ = load(html);
    const titles = $('head > title')
        .toArray()
        .map((element) => $(element).text().trim());
    const og: Record<string, string> = {};
    const twitter: Record<string, string> = {};
    let metaDescription: string | undefined;
    let metaRobots: string | undefined;
    let hasViewport = false;
    $('meta').each((_, element) => {
        const node = $(element);
        const name = node.attr('name')?.trim().toLowerCase();
        const property = node.attr('property')?.trim().toLowerCase();
        const content = node.attr('content')?.trim() ?? '';
        if (name === 'description' && metaDescription === undefined) {
            metaDescription = content;
        }
        if (name === 'robots' && metaRobots === undefined) {
            metaRobots = content;
        }
        if (name === 'viewport') {
            hasViewport = true;
        }
        if (property?.startsWith('og:')) {
            og[property] = content;
        }
        if (name?.startsWith('twitter:')) {
            twitter[name] = content;
        }
    });

    let canonical: string | undefined;
    const hreflang: { lang: string; href: string }[] = [];
    $('link').each((_, element) => {
        const node = $(element);
        const rel = (node.attr('rel') ?? '').toLowerCase().split(/\s+/);
        const href = attr(node.attr('href'));
        if (!href) {
            return;
        }
        if (rel.includes('canonical') && canonical === undefined) {
            canonical = href;
        }
        const lang = attr(node.attr('hreflang'));
        if (rel.includes('alternate') && lang) {
            hreflang.push({ lang, href });
        }
    });

    const prefixes = new Set<string>();
    const consider = (value: string | undefined): void => {
        if (!value || buildAssetMarker === false) {
            return;
        }
        const index = value.indexOf(buildAssetMarker);
        if (index >= 0) {
            prefixes.add(value.slice(0, index));
        }
    };
    $('script[src]').each((_, element) => consider($(element).attr('src')));
    $('link[href]').each((_, element) => consider($(element).attr('href')));

    return {
        htmlLang: attr($('html').attr('lang')),
        titles,
        metaDescription,
        metaRobots,
        canonical,
        hreflang,
        og,
        twitter,
        h1Count: $('h1').length,
        jsonLd: $('script[type="application/ld+json"]')
            .toArray()
            .map((element) => $(element).text().trim())
            .filter((text) => text.length > 0),
        hasViewport,
        nextStaticPrefixes: [...prefixes],
        links: sameOriginLinks($, pageUrl),
    };
}

function sameOriginLinks($: ReturnType<typeof load>, pageUrl: string): string[] {
    let origin: string;
    try {
        origin = new URL(pageUrl).origin;
    } catch {
        return [];
    }
    const links: string[] = [];
    const seen = new Set<string>();
    $('a[href]').each((_, element) => {
        const href = $(element).attr('href')?.trim();
        if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
            return;
        }
        try {
            const url = new URL(href, pageUrl);
            if (url.origin !== origin) {
                return;
            }
            url.hash = '';
            const absolute = url.toString();
            if (!seen.has(absolute)) {
                seen.add(absolute);
                links.push(absolute);
            }
        } catch {
            // Skip malformed hrefs.
        }
    });
    return links;
}
