import { validateXML } from 'xmllint-wasm';

import { SITEINDEX_XSD, SITEMAP_XSD } from './schemas.js';
import { checkFailed, checkPassed, type SeoCheckResult, type SitemapUrlRecord } from './types.js';
import { detectSitemapKind, extractSitemapLocs } from './xml-locs.js';

const SITEMAP_MAX_URLS = 50_000;
const SITEMAP_MAX_BYTES = 50 * 1024 * 1024;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export async function validateSitemapSchema(xml: string): Promise<SeoCheckResult> {
    const kind = detectSitemapKind(xml);
    if (!kind) {
        return checkFailed('sitemap-xsd', ['XML is not a sitemap urlset or sitemapindex']);
    }
    const schema = kind === 'urlset' ? SITEMAP_XSD : SITEINDEX_XSD;
    const result = await validateXML({
        xml: [{ fileName: `${kind}.xml`, contents: xml }],
        schema: [schema],
    });
    if (result.valid) {
        return checkPassed('sitemap-xsd');
    }
    return checkFailed(
        'sitemap-xsd',
        result.errors.map((error) => error.message),
    );
}

export function checkSitemapLimits(xml: string, urls: SitemapUrlRecord[]): SeoCheckResult {
    const messages: string[] = [];
    const bytes = Buffer.byteLength(xml, 'utf8');
    if (urls.length > SITEMAP_MAX_URLS) {
        messages.push(`contains ${urls.length} URLs (limit ${SITEMAP_MAX_URLS})`);
    }
    if (bytes > SITEMAP_MAX_BYTES) {
        messages.push(`is ${bytes} bytes (limit ${SITEMAP_MAX_BYTES})`);
    }
    return checkPassed('sitemap-limits', messages);
}

export function checkSitemapLocs(urls: SitemapUrlRecord[], origin: string, now = Date.now()): SeoCheckResult {
    const messages: string[] = [];
    const originUrl = new URL(origin);
    const seen = new Set<string>();

    for (const row of urls) {
        let parsed: URL;
        try {
            parsed = new URL(row.loc);
        } catch {
            messages.push(`invalid loc ${row.loc}`);
            continue;
        }
        if (parsed.protocol !== originUrl.protocol) {
            messages.push(`loc protocol must match origin: ${row.loc}`);
        }
        if (parsed.origin !== originUrl.origin) {
            messages.push(`loc is not same-origin: ${row.loc}`);
        }
        if (seen.has(row.loc)) {
            messages.push(`duplicate loc ${row.loc}`);
        }
        seen.add(row.loc);
        if (row.lastmod) {
            const lastmodMs = Date.parse(row.lastmod);
            if (Number.isNaN(lastmodMs)) {
                messages.push(`invalid lastmod ${row.lastmod} for ${row.loc}`);
            } else if (lastmodMs - now > ONE_DAY_MS) {
                messages.push(`lastmod more than 1 day in the future: ${row.lastmod} (${row.loc})`);
            }
        }
    }

    return checkPassed('sitemap-locs', messages);
}

export function parseSitemapXml(xml: string): { kind: 'urlset' | 'sitemapindex'; urls: SitemapUrlRecord[] } {
    const kind = detectSitemapKind(xml);
    if (!kind) {
        throw new Error('XML is not a sitemap urlset or sitemapindex');
    }
    return { kind, urls: extractSitemapLocs(xml) };
}
