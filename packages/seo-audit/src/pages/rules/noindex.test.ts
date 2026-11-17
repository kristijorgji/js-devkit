// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { auditContext, indexableAudit } from '../__fixtures__/pages.js';

import { applyNoindexRules } from './noindex.js';

describe('applyNoindexRules', () => {
    it('accepts a noindex page that is absent from every sitemap', () => {
        const page = indexableAudit(
            { indexable: false, inSitemap: null, robotsSource: 'meta' },
            { metaRobots: 'noindex,follow' },
        );
        expect(applyNoindexRules(page, auditContext).map((item) => item.ruleId)).not.toContain('noidx.not-in-sitemap');
    });

    it('flags noidx.not-in-sitemap when a noindex page is listed', () => {
        const page = indexableAudit({ indexable: false, inSitemap: 'public' });
        expect(applyNoindexRules(page, auditContext).map((item) => item.ruleId)).toContain('noidx.not-in-sitemap');
    });

    it('does not emit noidx.canonical-elsewhere when the canonical is this page', () => {
        const page = indexableAudit({ indexable: false, inSitemap: null });
        expect(applyNoindexRules(page, auditContext).map((item) => item.ruleId)).not.toContain(
            'noidx.canonical-elsewhere',
        );
    });

    it('flags noidx.canonical-elsewhere when the canonical points at another URL', () => {
        const page = indexableAudit(
            { indexable: false, inSitemap: null },
            { canonical: 'https://www.example.com/en/other' },
        );
        const issues = applyNoindexRules(page, auditContext);
        expect(issues.map((item) => item.ruleId)).toContain('noidx.canonical-elsewhere');
        expect(issues.find((item) => item.ruleId === 'noidx.canonical-elsewhere')?.severity).toBe('info');
    });
});
