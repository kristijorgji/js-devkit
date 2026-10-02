import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import type { StaticAssetTarget, StaticAssetsConfig } from './types.js';

import { findConfigFile, loadConfig, resolveStaticAssetsConfig } from './load-config.js';

const hashedStatic: StaticAssetTarget = {
    id: 'hashed-static',
    localDir: 'dist/static',
    remotePrefix: '{commitPrefix}/static',
    versioning: 'commit',
    cacheControl: 'public, max-age=31536000, immutable',
};

function baseConfig(root: string): StaticAssetsConfig {
    return {
        root,
        bucket: 'test-bucket',
        commit: 'deadbeef',
        commitPrefix: 'assets/{commit}',
        sharedPrefix: 'assets/shared',
        targets: [hashedStatic],
    };
}

describe('resolveStaticAssetsConfig', () => {
    it('expands commitPrefix and defaults region', () => {
        const resolved = resolveStaticAssetsConfig(baseConfig('/tmp/app'));
        expect(resolved.commitPrefix).toBe('assets/deadbeef');
        expect(resolved.sharedPrefix).toBe('assets/shared');
        expect(resolved.region).toBe('us-east-1');
        expect(resolved.forcePathStyle).toBe(false);
        expect(resolved.requiredTargetIds).toEqual([]);
    });

    it('requires root, bucket, commit, prefixes, and targets', () => {
        expect(() => resolveStaticAssetsConfig({ ...baseConfig('/tmp/app'), root: '' })).toThrow(/root/);
        expect(() => resolveStaticAssetsConfig({ ...baseConfig('/tmp/app'), bucket: '' })).toThrow(/bucket/);
        expect(() => resolveStaticAssetsConfig({ ...baseConfig('/tmp/app'), commit: '' })).toThrow(/commit/);
        expect(() => resolveStaticAssetsConfig({ ...baseConfig('/tmp/app'), commitPrefix: '' })).toThrow(/commitPrefix/);
        expect(() => resolveStaticAssetsConfig({ ...baseConfig('/tmp/app'), sharedPrefix: '' })).toThrow(/sharedPrefix/);
        expect(() => resolveStaticAssetsConfig({ ...baseConfig('/tmp/app'), targets: [] })).toThrow(/targets/);
    });

    it('invokes validateCommit', () => {
        expect(() =>
            resolveStaticAssetsConfig({
                ...baseConfig('/tmp/app'),
                validateCommit: (commit) => {
                    throw new Error(`bad commit ${commit}`);
                },
            }),
        ).toThrow('bad commit deadbeef');
    });
});

describe('loadConfig', () => {
    it('loads a TypeScript config via jiti', async () => {
        const dir = mkdtempSync(join(tmpdir(), 'static-assets-config-'));
        writeFileSync(
            join(dir, 'static-assets.config.ts'),
            `export default {
                root: ${JSON.stringify(dir)},
                bucket: 'demo-bucket',
                commit: 'abc1234',
                commitPrefix: 'assets/{commit}',
                sharedPrefix: 'assets/shared',
                targets: [{
                    id: 'hashed-static',
                    localDir: 'dist/static',
                    remotePrefix: '{commitPrefix}/static',
                    versioning: 'commit',
                    cacheControl: 'public, max-age=31536000, immutable',
                }],
            };\n`,
        );
        try {
            expect(findConfigFile(dir)).toContain('static-assets.config.ts');
            const loaded = await loadConfig(dir);
            expect(loaded.bucket).toBe('demo-bucket');
            expect(loaded.commitPrefix).toBe('assets/abc1234');
        } finally {
            rmSync(dir, { recursive: true, force: true });
        }
    });

    it('walks upward to find the config file', () => {
        const dir = mkdtempSync(join(tmpdir(), 'static-assets-nested-'));
        const nested = join(dir, 'src', 'app');
        mkdirSync(nested, { recursive: true });
        writeFileSync(
            join(dir, 'static-assets.config.ts'),
            `export default {
                root: '.',
                bucket: 'demo-bucket',
                commit: 'abc1234',
                commitPrefix: 'assets/{commit}',
                sharedPrefix: 'assets/shared',
                targets: [{
                    id: 'hashed-static',
                    localDir: 'dist/static',
                    remotePrefix: '{commitPrefix}/static',
                    versioning: 'commit',
                    cacheControl: 'public, max-age=31536000, immutable',
                }],
            };\n`,
        );
        try {
            expect(findConfigFile(nested)).toBe(join(dir, 'static-assets.config.ts'));
        } finally {
            rmSync(dir, { recursive: true, force: true });
        }
    });
});
