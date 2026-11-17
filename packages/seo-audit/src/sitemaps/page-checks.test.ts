import { describe, expect, it } from 'vitest';

import { checkSampledPage, sampleLocs } from './page-checks.js';

const LOC = 'https://example.com/en/privacy';

describe('page-checks', () => {
    it('requires 200, no noindex, and a matching canonical', () => {
        const html = `<html><head><link rel="canonical" href="${LOC}"><meta name="robots" content="index,follow"></head></html>`;
        expect(checkSampledPage({ loc: LOC, status: 200, html }).ok).toBe(true);
    });

    it('fails redirects, noindex, and a mismatched canonical', () => {
        const redirected = checkSampledPage({ loc: LOC, status: 301, html: '' });
        expect(redirected.ok).toBe(false);
        const noindex = checkSampledPage({
            loc: LOC,
            status: 200,
            html: `<html><head><link rel="canonical" href="${LOC}"></head></html>`,
            robotsTag: 'noindex',
        });
        expect(noindex.ok).toBe(false);
        const mismatch = checkSampledPage({
            loc: LOC,
            status: 200,
            html: '<html><head><link href="https://example.com/en" rel="canonical"></head></html>',
        });
        expect(mismatch.ok).toBe(false);
        expect(mismatch.messages.join('\n')).toMatch(/canonical is/);
    });

    it('samples unique locs', () => {
        expect(sampleLocs(['a', 'a', 'b', 'c'], 2)).toEqual(['a', 'b']);
        expect(sampleLocs(['a', 'b'], 'all')).toEqual(['a', 'b']);
    });
});
