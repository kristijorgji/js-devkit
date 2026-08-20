import { describe, expect, it } from 'vitest';

import { fixtureConfig } from '../__fixtures__/test-config.js';

import { buildRouteCatalog } from './build-catalog.js';
import { renderApiRoutesHtml } from './render-html.js';
import { renderApiRoutesMarkdown } from './render-markdown.js';

describe('buildRouteCatalog', () => {
    it('builds rows from the anonymized fixture', () => {
        const rows = buildRouteCatalog(fixtureConfig());
        expect(rows.map((row) => `${row.method} ${row.path}`)).toEqual([
            'POST /auth/login',
            'POST /auth/logout',
            'POST /auth/refresh',
            'GET /health',
            'GET /posts',
            'DELETE /posts/:id',
            'GET /posts/:id',
            'PATCH /posts/:id/approve',
        ]);
        expect(rows.find((row) => row.path === '/health')?.authRequired).toBe('No');
        expect(rows.find((row) => row.method === 'GET' && row.path === '/posts')?.authRequired).toBe(
            'JWT or API key',
        );
        expect(rows.find((row) => row.method === 'DELETE')?.authRequired).toBe('JWT');
    });

    it('uses resolveAuthLabel and footnotes hooks', () => {
        const config = fixtureConfig({
            document: fixtureConfig().document,
            resolveAuthLabel: (op, security) =>
                op.path === '/posts' && op.method === 'GET' ? 'Public [^list]' : security.bearer ? 'JWT' : 'No',
            footnotes: ['[^list]: List is public at the middleware layer.'],
        });
        const rows = buildRouteCatalog(config);
        expect(rows.find((row) => row.method === 'GET' && row.path === '/posts')?.authRequired).toBe('Public [^list]');
        const markdown = renderApiRoutesMarkdown(rows, config);
        expect(markdown).toContain('[^list]: List is public at the middleware layer.');
        expect(markdown).not.toMatch(/prona/i);
    });

    it('renders HTML through docs-viewer placeholders', () => {
        const config = fixtureConfig();
        const html = renderApiRoutesHtml(buildRouteCatalog(config), config);
        expect(html).toContain('<title>API routes</title>');
        expect(html).toContain('"path":"/posts/:id"');
        expect(html).not.toContain('__VIEWER_TITLE__');
        expect(html).not.toContain('<!-- VIEWER_DATA -->');
    });
});
