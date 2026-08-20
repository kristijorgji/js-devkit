import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import {
    buildVendorChunkGlobPath,
    extractVendorChunkId,
    isVendorChunkFilename,
    readRootMainVendorChunkFilenames,
    resolveSharedVendorChunks,
} from './vendor-chunks.js';

describe('isVendorChunkFilename', () => {
    it('accepts numeric and hex webpack vendor chunks', () => {
        expect(isVendorChunkFilename('5748-abc123.js')).toBe(true);
        expect(isVendorChunkFilename('ebe48810-deadbeef.js')).toBe(true);
    });

    it('rejects stable runtime and app-style names', () => {
        expect(isVendorChunkFilename('framework-abc.js')).toBe(false);
        expect(isVendorChunkFilename('main-abc.js')).toBe(false);
        expect(isVendorChunkFilename('polyfills-abc.js')).toBe(false);
        expect(isVendorChunkFilename('webpack-abc.js')).toBe(false);
        expect(isVendorChunkFilename('main-app-abc.js')).toBe(false);
        expect(isVendorChunkFilename('not-a-chunk.js')).toBe(false);
    });
});

describe('resolveSharedVendorChunks', () => {
    let tempDir: string | undefined;

    afterEach(() => {
        if (tempDir) {
            rmSync(tempDir, { recursive: true, force: true });
            tempDir = undefined;
        }
    });

    it('reads shared vendor chunks from build-manifest rootMainFiles', () => {
        tempDir = mkdtempSync(join(tmpdir(), 'size-limit-chunks-'));
        const chunksDir = join(tempDir, 'static/chunks');
        mkdirSync(chunksDir, { recursive: true });
        writeFileSync(
            join(tempDir, 'build-manifest.json'),
            JSON.stringify({
                rootMainFiles: [
                    'static/chunks/webpack-abc.js',
                    'static/chunks/ebe48810-large.js',
                    'static/chunks/1103-small.js',
                    'static/chunks/main-app-abc.js',
                ],
            }),
        );
        writeFileSync(join(chunksDir, '1103-small.js'), 'a'.repeat(100));
        writeFileSync(join(chunksDir, 'ebe48810-large.js'), 'b'.repeat(500));

        expect(readRootMainVendorChunkFilenames(tempDir)).toEqual(['ebe48810-large.js', '1103-small.js']);

        const ranked = resolveSharedVendorChunks(tempDir);

        expect(ranked.map((chunk) => chunk.id)).toEqual(['ebe48810', '1103']);
        expect(ranked[0]?.globPath).toBe(buildVendorChunkGlobPath('ebe48810'));
        expect(extractVendorChunkId('1103-small.js')).toBe('1103');
    });
});
