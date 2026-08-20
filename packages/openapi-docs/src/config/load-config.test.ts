import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { findConfigFile, loadConfig, resolveOpenApiDocsConfig } from './load-config.js';

describe('resolveOpenApiDocsConfig', () => {
    it('applies defaults', () => {
        const resolved = resolveOpenApiDocsConfig({ document: 'docs/openapi.json' });
        expect(resolved.basename).toBe('api-routes');
        expect(resolved.viewerTitle).toBe('API routes');
        expect(resolved.apiKeyHeaderName).toBe('X-API-Key');
        expect(resolved.postman.baseUrlVar).toBe('baseApiUrl');
        expect(resolved.postman.adminTag).toBe('Admin');
        expect(resolved.postman.authPaths.login).toEqual(['login']);
        expect(resolved.formatMarkdown('hi')).toBe('hi');
    });

    it('requires document', () => {
        expect(() => resolveOpenApiDocsConfig({ document: '' })).toThrow(/document/);
    });
});

describe('loadConfig', () => {
    it('loads a TypeScript config via jiti', async () => {
        const dir = mkdtempSync(join(tmpdir(), 'openapi-docs-config-'));
        writeFileSync(
            join(dir, 'openapi-docs.config.ts'),
            `export default { document: ${JSON.stringify(join(dir, 'openapi.json'))}, viewerTitle: 'Demo API' };\n`,
        );
        try {
            expect(findConfigFile(dir)).toContain('openapi-docs.config.ts');
            const loaded = await loadConfig(dir);
            expect(loaded.viewerTitle).toBe('Demo API');
        } finally {
            rmSync(dir, { recursive: true, force: true });
        }
    });

    it('walks upward to find the config file', () => {
        const dir = mkdtempSync(join(tmpdir(), 'openapi-docs-nested-'));
        const nested = join(dir, 'src', 'http');
        mkdirSync(nested, { recursive: true });
        writeFileSync(join(dir, 'openapi-docs.config.ts'), 'export default { document: "openapi.json" };\n');
        try {
            expect(findConfigFile(nested)).toBe(join(dir, 'openapi-docs.config.ts'));
        } finally {
            rmSync(dir, { recursive: true, force: true });
        }
    });
});
