// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { indexableAudit } from './__fixtures__/pages.js';
import type { WebRoutesDocument } from './classify-route.js';
import { renderReportHtml } from './report-html.js';
import { buildReport } from './report-json.js';

describe('renderReportHtml', () => {
    it('embeds the report as JSON and escapes a script-breaking title', () => {
        const routes: WebRoutesDocument = {
            appPages: [{ routeName: 'home', pathsByLocale: { en: '/en' }, indexable: 'Yes' }],
        };
        const report = buildReport({
            baseUrl: 'https://www.example.com',
            routes,
            generatedAt: '2026-10-21T00:00:00.000Z',
            pages: [
                indexableAudit({ locale: 'en' }, { titles: ['</script><script>alert(1)</script>'] }),
                indexableAudit({ url: 'https://www.example.com/sq', locale: 'sq' }),
                indexableAudit({ url: 'https://www.example.com/de', locale: 'de' }),
                indexableAudit({ url: 'https://www.example.com/it', locale: 'it' }),
            ],
        });
        const html = renderReportHtml(report);
        expect(html).toContain('id="seo-audit-data"');
        const match = /<script type="application\/json" id="seo-audit-data">([\s\S]*?)<\/script>/.exec(html);
        expect(match?.[1]).toBeDefined();
        expect(JSON.parse(match?.[1] ?? '')).toEqual(report);
        expect(html).not.toContain('</script><script>alert');
        for (const locale of ['en', 'sq', 'de', 'it', 'mk']) {
            expect(html).toContain(locale);
        }
        expect(html).toContain('prefers-color-scheme: dark');
        expect(html).toContain('--bg');
        expect(html).toContain('id="coverage-panel" hidden');
        expect(html).toContain('name="viewport"');
    });
});
