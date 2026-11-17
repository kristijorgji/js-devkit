// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { indexableAudit, indexableParsed, SUPPORTED } from '../__fixtures__/pages.js';

import { applyCrossPageRules } from './cross-page.js';

const CROSS_OPTS = { baseUrl: 'https://www.example.com', supportedLocales: SUPPORTED };

describe('applyCrossPageRules', () => {
    it('accepts reciprocal hreflang, an indexable canonical target, and unique copy', () => {
        const home = indexableAudit();
        const sq = indexableAudit(
            { url: 'https://www.example.com/sq', locale: 'sq', routeName: 'home' },
            indexableParsed({
                htmlLang: 'sq',
                canonical: 'https://www.example.com/sq',
                titles: ['Example shtepi per shitje dhe qira ne Shqiperi'],
                metaDescription:
                    'Kerkoni apartamente, shtepi dhe toka per shitje dhe qira ne Shqiperi me foto, cmime dhe harta te lagjeve.',
            }),
        );
        applyCrossPageRules([home, sq], CROSS_OPTS);
        expect(home.issues).toEqual([]);
        expect(sq.issues).toEqual([]);
    });

    it('flags cross.hreflang-reciprocal when the alternate does not list this page', () => {
        const home = indexableAudit();
        const sq = indexableAudit(
            { url: 'https://www.example.com/sq', locale: 'sq' },
            { hreflang: [{ lang: 'sq', href: 'https://www.example.com/sq' }] },
        );
        applyCrossPageRules([home, sq], CROSS_OPTS);
        expect(home.issues.map((item) => item.ruleId)).toContain('cross.hreflang-reciprocal');
    });

    it('flags cross.canonical-target-ok when the fetched canonical target is not indexable', () => {
        const home = indexableAudit({}, { canonical: 'https://www.example.com/sq' });
        const sq = indexableAudit({ url: 'https://www.example.com/sq', locale: 'sq', indexable: false, status: 200 });
        applyCrossPageRules([home, sq], CROSS_OPTS);
        expect(home.issues.map((item) => item.ruleId)).toContain('cross.canonical-target-ok');
    });

    it('flags cross.alternate-status when a fetched alternate is not 200', () => {
        const home = indexableAudit();
        const sq = indexableAudit({ url: 'https://www.example.com/sq', locale: 'sq', status: 404, indexable: false });
        applyCrossPageRules([home, sq], CROSS_OPTS);
        expect(home.issues.map((item) => item.ruleId)).toContain('cross.alternate-status');
    });

    it('does not flag the origin-root x-default 307', () => {
        const home = indexableAudit();
        const root = indexableAudit({
            url: 'https://www.example.com/',
            locale: 'en',
            status: 307,
            indexable: false,
        });
        applyCrossPageRules([home, root], CROSS_OPTS);
        expect(home.issues.map((item) => item.ruleId)).not.toContain('cross.alternate-status');
    });

    it('flags duplicate titles and descriptions on indexable pages in one locale', () => {
        const first = indexableAudit({ url: 'https://www.example.com/en/a', routeName: 'cityPillar' });
        const second = indexableAudit({ url: 'https://www.example.com/en/b', routeName: 'countryPillar' });
        applyCrossPageRules([first, second], CROSS_OPTS);
        expect(first.issues.map((item) => item.ruleId)).toEqual(
            expect.arrayContaining(['cross.duplicate-title', 'cross.duplicate-description']),
        );
        expect(first.issues.find((item) => item.ruleId === 'cross.duplicate-title')?.message).toContain(
            'https://www.example.com/en/b',
        );
    });
});
