import { describe, expect, it } from 'vitest';

import { DEFAULT_VIEWER_TITLE, escapeHtml, renderBundleHistoryHtml } from './render-viewer-html.js';

describe('escapeHtml', () => {
    it('escapes markup characters', () => {
        expect(escapeHtml(`Acme <script> & "Co"`)).toBe('Acme &lt;script&gt; &amp; &quot;Co&quot;');
    });
});

describe('renderBundleHistoryHtml', () => {
    it('uses the default title when none is provided', () => {
        const html = renderBundleHistoryHtml([]);
        expect(html).toContain(`<title>${DEFAULT_VIEWER_TITLE}</title>`);
        expect(html).toContain(`<h1>${DEFAULT_VIEWER_TITLE}</h1>`);
        expect(html).not.toContain('__VIEWER_TITLE__');
        expect(html).not.toContain('Prona365');
    });

    it('injects a custom escaped title into title and heading', () => {
        const html = renderBundleHistoryHtml([], 'History — Demo <App>');
        expect(html).toContain('<title>History — Demo &lt;App&gt;</title>');
        expect(html).toContain('<h1>History — Demo &lt;App&gt;</h1>');
        expect(html).toContain('const history = [];');
    });
});
