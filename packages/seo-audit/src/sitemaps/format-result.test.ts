// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { formatCheckLine } from './format-result.js';

describe('formatCheckLine', () => {
    it('masks the sitemap secret on FAIL lines', () => {
        const secret = 'super-secret-token';
        const line = formatCheckLine(
            {
                name: `sitemap:https://www.example.com/sitemaps/${secret}/en/agencies/1.xml`,
                ok: false,
                messages: [`HTTP 504 for /sitemaps/${secret}/en/agencies/1.xml`],
            },
            secret,
        );
        expect(line).toMatch(/^FAIL /);
        expect(line).not.toContain(secret);
        expect(line).toContain('***');
    });
});
