// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { indexableAudit } from './__fixtures__/pages.js';
import type { WebRoutesDocument } from './classify-route.js';
import { buildCoverage } from './coverage.js';
import type { CoverageCell } from './types.js';

describe('buildCoverage', () => {
    it('counts sampled pages and lists indexable routes with no sample', () => {
        const routes: WebRoutesDocument = {
            appPages: [
                { routeName: 'home', pathsByLocale: { en: '/en' }, indexable: 'Yes' },
                { routeName: 'properties', pathsByLocale: { en: '/en/properties' }, indexable: 'Yes' },
                { routeName: 'login', pathsByLocale: { en: '/en/login' }, indexable: 'No' },
            ],
        };
        const page = indexableAudit({ issues: [{ ruleId: 'idx.single-h1', severity: 'warn', message: 'two' }] });
        const { coverage, uncoveredRoutes } = buildCoverage([page], routes);
        expect(coverage.home?.en).toEqual({ indexable: 1, noindex: 0, errors: 0, warns: 1 } satisfies CoverageCell);
        expect(uncoveredRoutes).toEqual(['properties']);
    });
});
