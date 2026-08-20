import { describe, expect, it } from 'vitest';

import {
    escapeSizeLimitGlobPath,
    suggestedRouteOwnedLimitFromMeasuredSize,
    unescapeSizeLimitGlobPath,
} from './limit-format.js';

describe('suggestedRouteOwnedLimitFromMeasuredSize', () => {
    it('uses 15% headroom for large routes', () => {
        expect(suggestedRouteOwnedLimitFromMeasuredSize(Math.round(101.06 * 1024))).toBe('117 KB');
    });

    it('applies a +2 KB floor for tiny routes', () => {
        expect(suggestedRouteOwnedLimitFromMeasuredSize(174)).toBe('3 KB');
    });
});

describe('escapeSizeLimitGlobPath', () => {
    it('escapes App Router brackets and route-group parentheses', () => {
        const path = '.next/static/chunks/app/[locale]/(cached)/(site)/page-abc.js';
        const escaped = escapeSizeLimitGlobPath(path);
        expect(escaped).toBe('.next/static/chunks/app/[[]locale[]]/[(]cached[)]/[(]site[)]/page-abc.js');
        expect(unescapeSizeLimitGlobPath(escaped)).toBe(path);
    });
});
