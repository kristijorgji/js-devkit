// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { auditContext, indexableAudit, indexableParsed } from '../__fixtures__/pages.js';

import { applyIndexableRules } from './indexable.js';

function ruleIds(page: ReturnType<typeof indexableAudit>, ctx = auditContext): string[] {
    return applyIndexableRules(page, ctx).map((item) => item.ruleId);
}

describe('applyIndexableRules', () => {
    it('accepts a complete indexable page', () => {
        expect(ruleIds(indexableAudit())).toEqual([]);
    });

    it.each([
        ['idx.title-present', indexableAudit({}, { titles: [''] })],
        ['idx.title-length', indexableAudit({}, { titles: ['Too short'] })],
        ['idx.description-present', indexableAudit({}, { metaDescription: '' })],
        ['idx.description-length', indexableAudit({}, { metaDescription: 'Too short to describe this page well.' })],
        ['idx.canonical-present', indexableAudit({}, { canonical: undefined })],
        ['idx.canonical-self', indexableAudit({}, { canonical: 'https://www.example.com/en/other' })],
        [
            'idx.hreflang-complete',
            indexableAudit({}, { hreflang: [{ lang: 'en', href: 'https://www.example.com/en' }] }),
        ],
        [
            'idx.hreflang-self',
            indexableAudit(
                {},
                {
                    hreflang: [
                        { lang: 'en', href: 'https://www.example.com/en/other' },
                        { lang: 'sq', href: 'https://www.example.com/sq' },
                        { lang: 'de', href: 'https://www.example.com/de' },
                        { lang: 'it', href: 'https://www.example.com/it' },
                        { lang: 'x-default', href: 'https://www.example.com/' },
                    ],
                },
            ),
        ],
        ['idx.og-required', indexableAudit({}, { og: { 'og:title': 'Example homes for sale and rent in Exampleland' } })],
        [
            'idx.og-url-matches-canonical',
            indexableAudit({}, { og: { ...indexableParsed().og, 'og:url': 'https://www.example.com/en/other' } }),
        ],
        [
            'idx.og-image-absolute',
            indexableAudit({}, { og: { ...indexableParsed().og, 'og:image': '/en/opengraph-image' } }),
        ],
        ['idx.twitter-card', indexableAudit({}, { twitter: {} })],
        ['idx.single-h1', indexableAudit({}, { h1Count: 2 })],
        ['idx.in-sitemap', indexableAudit({ inSitemap: null })],
    ] as const)('flags %s', (ruleId, page) => {
        expect(ruleIds(page)).toContain(ruleId);
    });
});
