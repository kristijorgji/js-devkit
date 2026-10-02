import { readFileSync } from 'node:fs';

import { PutObjectCommand } from '@aws-sdk/client-s3';

import type { StaticAssetStoreClient, UploadPlan, UploadResult } from '../config/types.js';

export class S3UploadProvider {
    constructor(private readonly client: StaticAssetStoreClient) {}

    async upload(plan: UploadPlan, options: { dryRun: boolean }): Promise<UploadResult> {
        const uploadedByTarget: Record<string, number> = {};

        for (const entry of plan.entries) {
            uploadedByTarget[entry.targetId] = (uploadedByTarget[entry.targetId] ?? 0) + 1;

            if (options.dryRun) {
                continue;
            }

            await this.client.send(
                new PutObjectCommand({
                    Bucket: plan.bucket,
                    Key: entry.remoteKey,
                    Body: readFileSync(entry.localPath),
                    ContentType: entry.contentType,
                    CacheControl: entry.cacheControl,
                }),
            );
        }

        return { uploadedByTarget, totalUploaded: plan.entries.length };
    }
}
