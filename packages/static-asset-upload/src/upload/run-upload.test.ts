import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { PutObjectCommand } from '@aws-sdk/client-s3';
import { describe, expect, it, vi } from 'vitest';

import type { StaticAssetsConfig } from '../config/types.js';

import { runStaticAssetUpload } from './run-upload.js';

function writeSyntheticTree(root: string): void {
    mkdirSync(join(root, 'dist/static'), { recursive: true });
    writeFileSync(join(root, 'dist/static/app.js'), 'console.log("app")');
    mkdirSync(join(root, 'public'), { recursive: true });
    writeFileSync(join(root, 'public/icon.png'), 'png');
}

function syntheticConfig(root: string): StaticAssetsConfig {
    return {
        root,
        bucket: 'test-bucket',
        region: 'eu-central-1',
        commit: 'deadbeef',
        commitPrefix: 'assets/{commit}',
        sharedPrefix: 'assets/shared',
        targets: [
            {
                id: 'hashed-static',
                localDir: 'dist/static',
                remotePrefix: '{commitPrefix}/static',
                versioning: 'commit',
                cacheControl: 'public, max-age=31536000, immutable',
            },
            {
                id: 'public-icons',
                localDir: 'public',
                remotePrefix: '{sharedPrefix}',
                versioning: 'shared',
                cacheControl: 'public, max-age=10800',
                include: ['icon.png'],
            },
        ],
    };
}

describe('runStaticAssetUpload', () => {
    it('puts objects via an injected client', async () => {
        const root = mkdtempSync(join(tmpdir(), 'upload-put-'));
        writeSyntheticTree(root);
        const send = vi.fn().mockResolvedValue({});
        try {
            const result = await runStaticAssetUpload(syntheticConfig(root), { client: { send } });
            expect(result.totalUploaded).toBe(2);
            expect(send).toHaveBeenCalledTimes(2);
            const first = send.mock.calls[0]?.[0];
            expect(first).toBeInstanceOf(PutObjectCommand);
            expect(first.input).toMatchObject({
                Bucket: 'test-bucket',
                Key: 'assets/deadbeef/static/app.js',
                ContentType: 'application/javascript',
                CacheControl: 'public, max-age=31536000, immutable',
            });
        } finally {
            rmSync(root, { recursive: true, force: true });
        }
    });

    it('does not put objects on dry-run', async () => {
        const root = mkdtempSync(join(tmpdir(), 'upload-dry-'));
        writeSyntheticTree(root);
        const send = vi.fn();
        try {
            const result = await runStaticAssetUpload(syntheticConfig(root), {
                dryRun: true,
                client: { send },
            });
            expect(result.totalUploaded).toBe(0);
            expect(send).not.toHaveBeenCalled();
        } finally {
            rmSync(root, { recursive: true, force: true });
        }
    });
});
