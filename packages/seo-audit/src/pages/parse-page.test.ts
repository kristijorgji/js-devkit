// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { indexablePageHtml, noindexPageHtml } from './__fixtures__/pages.js';
import { parsePage } from './parse-page.js';

describe('parsePage', () => {
    it('reads metadata, hreflang, open graph, and same-origin links', () => {
        const html = indexablePageHtml({
            links: ['https://www.example.com/en/country', 'https://example.com/out', '#section'],
        });
        const parsed = parsePage(html, 'https://www.example.com/en');
        expect(parsed.htmlLang).toBe('en');
        expect(parsed.titles).toEqual(['Example homes for sale and rent in Exampleland']);
        expect(parsed.metaDescription).toContain('apartments');
        expect(parsed.canonical).toBe('https://www.example.com/en');
        expect(parsed.hreflang.map((entry) => entry.lang)).toEqual(['en', 'sq', 'de', 'it', 'mk', 'x-default']);
        expect(parsed.og['og:type']).toBe('website');
        expect(parsed.og['og:site_name']).toBe('Example');
        expect(parsed.twitter['twitter:card']).toBe('summary_large_image');
        expect(parsed.h1Count).toBe(1);
        expect(parsed.jsonLd).toHaveLength(1);
        expect(parsed.hasViewport).toBe(true);
        expect(parsed.nextStaticPrefixes).toEqual(['https://cdn.example.com/web/abc1234']);
        expect(parsed.links).toEqual(['https://www.example.com/en/country']);
    });

    it('collects every distinct _next/static prefix', () => {
        const html = indexablePageHtml({
            prefixes: ['https://cdn.example.com/web/dev', 'https://cdn.example.com/web/abc1234'],
        });
        const parsed = parsePage(html, 'https://www.example.com/en');
        expect(parsed.nextStaticPrefixes).toEqual([
            'https://cdn.example.com/web/dev',
            'https://cdn.example.com/web/abc1234',
        ]);
    });

    it('reads a noindex robots meta tag', () => {
        const parsed = parsePage(noindexPageHtml(), 'https://www.example.com/en');
        expect(parsed.metaRobots).toBe('noindex,follow');
    });
});
