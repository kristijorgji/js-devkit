import { describe, expect, it } from 'vitest';

import { escapeHtml } from './escape-html.js';
import { PLACEHOLDERS, renderDocsViewerHtml } from './render.js';

const TEMPLATE = `<!DOCTYPE html>
<html>
<head>
  <title>${PLACEHOLDERS.title}</title>
  <style>
${PLACEHOLDERS.styles}
  </style>
</head>
<body>
  <h1>${PLACEHOLDERS.title}</h1>
  <script>const DATA = ${PLACEHOLDERS.data};</script>
</body>
</html>
`;

describe('renderDocsViewerHtml', () => {
    it('injects escaped title into title and heading', () => {
        const html = renderDocsViewerHtml({
            template: TEMPLATE,
            data: { rows: [] },
            title: 'Routes <script>alert(1)</script>',
        });
        expect(html).toContain('<title>Routes &lt;script&gt;alert(1)&lt;/script&gt;</title>');
        expect(html).toContain('<h1>Routes &lt;script&gt;alert(1)&lt;/script&gt;</h1>');
        expect(html).not.toContain('<script>alert(1)</script>');
    });

    it('defaults the title to Docs', () => {
        const html = renderDocsViewerHtml({ template: TEMPLATE, data: {} });
        expect(html).toContain('<title>Docs</title>');
    });

    it('injects catalog JSON and base styles', () => {
        const html = renderDocsViewerHtml({
            template: TEMPLATE,
            data: { hello: 'world' },
            extraStyles: 'h2 { color: red; }',
        });
        expect(html).toContain('{"hello":"world"}');
        expect(html).toContain(':root');
        expect(html).toContain('h2 { color: red; }');
        expect(html).not.toContain(PLACEHOLDERS.styles);
        expect(html).not.toContain(PLACEHOLDERS.data);
    });
});

describe('escapeHtml', () => {
    it('escapes quotes and ampersands', () => {
        expect(escapeHtml(`&<>"'`)).toBe('&amp;&lt;&gt;&quot;&#39;');
    });
});
