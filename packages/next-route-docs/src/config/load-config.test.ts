import { mkdirSync, writeFileSync } from 'node:fs';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { findConfigFile, loadConfig, resolveRouteDocsConfig } from './load-config.js';

describe('resolveRouteDocsConfig', () => {
    it('applies defaults', () => {
        const resolved = resolveRouteDocsConfig({ appRoot: '/tmp/app' });
        expect(resolved.basename).toBe('routes');
        expect(resolved.viewerTitle).toBe('Routes');
        expect(resolved.locales).toEqual([]);
        expect(resolved.localeParam).toBe('locale');
        expect(resolved.resolveRouteName('x')).toBeNull();
        expect(resolved.formatMarkdown('hi')).toBe('hi');
    });

    it('requires appRoot', () => {
        expect(() => resolveRouteDocsConfig({ appRoot: '' })).toThrow(/appRoot/);
    });
});

describe('loadConfig', () => {
    it('loads a TypeScript config via jiti', async () => {
        const dir = mkdtempSync(join(tmpdir(), 'route-docs-config-'));
        mkdirSync(join(dir, 'src/app'), { recursive: true });
        writeFileSync(
            join(dir, 'next-route-docs.config.ts'),
            `export default { appRoot: ${JSON.stringify(dir)}, viewerTitle: 'Demo routes' };\n`,
        );
        try {
            expect(findConfigFile(dir)).toContain('next-route-docs.config.ts');
            const loaded = await loadConfig(dir);
            expect(loaded.viewerTitle).toBe('Demo routes');
            expect(loaded.appDir).toBe(join(dir, 'src/app'));
        } finally {
            rmSync(dir, { recursive: true, force: true });
        }
    });
});
