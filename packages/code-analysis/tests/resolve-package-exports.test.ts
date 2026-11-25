import { describe, expect, it } from 'vitest';

import { resolveExportSubpath } from '../src/analyzers/shared-consumers/resolve-package-exports.js';

describe('resolveExportSubpath', () => {
    const exportsField = {
        './direct': './src/direct.ts',
        './*': './src/*/index.ts',
        './features/*': './src/features/*.ts',
        './obj': { import: './src/obj.js', types: './src/obj.d.ts' },
    };

    it('resolves an exact key', () => {
        expect(resolveExportSubpath(exportsField, './direct')).toBe('./src/direct.ts');
    });

    it('resolves a single-star pattern', () => {
        expect(resolveExportSubpath(exportsField, './alpha')).toBe('./src/alpha/index.ts');
    });

    it('prefers the longest matching prefix', () => {
        expect(resolveExportSubpath(exportsField, './features/list')).toBe('./src/features/list.ts');
    });

    it('resolves object targets via import then default then types', () => {
        expect(resolveExportSubpath(exportsField, './obj')).toBe('./src/obj.js');
    });

    it('returns null when nothing matches', () => {
        expect(resolveExportSubpath(exportsField, 'nope')).toBeNull();
    });
});
