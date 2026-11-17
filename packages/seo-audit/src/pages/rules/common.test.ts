// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { auditContext, indexableAudit } from '../__fixtures__/pages.js';

import { applyCommonRules } from './common.js';

function ruleIds(page: ReturnType<typeof indexableAudit>, ctx = auditContext): string[] {
    return applyCommonRules(page, ctx).map((item) => item.ruleId);
}

describe('applyCommonRules', () => {
    it('accepts a page from the current build', () => {
        expect(ruleIds(indexableAudit())).toEqual([]);
    });

    it('flags a page whose _next/static assets come from a different build prefix (web/dev)', () => {
        const page = indexableAudit({}, { nextStaticPrefixes: ['https://cdn.example.com/web/dev'] });
        expect(ruleIds(page)).toContain('common.assets-single-build');
    });

    it.each([
        ['common.html-lang', indexableAudit({}, { htmlLang: 'sq' })],
        ['common.single-title', indexableAudit({}, { titles: ['One', 'Two'] })],
        ['common.viewport', indexableAudit({}, { hasViewport: false })],
        ['common.jsonld-valid', indexableAudit({}, { jsonLd: ['{'] })],
        ['common.http-status', indexableAudit({ status: 301, parsed: undefined })],
        [
            'common.jsonld-dataset-description',
            indexableAudit(
                {},
                {
                    jsonLd: ['{"@context":"https://schema.org","@type":"Dataset","name":"Exampleland listings"}'],
                },
            ),
        ],
    ] as const)('flags %s', (ruleId, page) => {
        expect(ruleIds(page)).toContain(ruleId);
    });

    it('accepts Dataset JSON-LD that includes a description', () => {
        const page = indexableAudit(
            {},
            {
                jsonLd: [
                    '{"@context":"https://schema.org","@type":"Dataset","name":"Exampleland listings","description":"Active listings and asking prices in Exampleland."}',
                ],
            },
        );
        expect(ruleIds(page)).not.toContain('common.jsonld-dataset-description');
    });
});
