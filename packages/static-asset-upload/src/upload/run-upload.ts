import { S3Client } from '@aws-sdk/client-s3';
import { cliLogger } from '@kristijorgji/cli-kit';

import { resolveStaticAssetsConfig } from '../config/load-config.js';
import type {
    ResolvedStaticAssetsConfig,
    StaticAssetUploadOptions,
    StaticAssetsConfig,
    UploadPlan,
    UploadResult,
} from '../config/types.js';
import { assertRequiredTargets, resolveUploadPlan } from '../plan/resolve-plan.js';

import { S3UploadProvider } from './s3-provider.js';

function createS3Client(config: ResolvedStaticAssetsConfig): S3Client {
    return new S3Client({
        region: config.region,
        ...(config.endpoint ? { endpoint: config.endpoint } : {}),
        ...(config.forcePathStyle ? { forcePathStyle: true } : {}),
    });
}

function logDryRunPlan(plan: UploadPlan): void {
    cliLogger.info(`Dry run — ${plan.entries.length} files would upload to s3://${plan.bucket}/`);
    for (const entry of plan.entries) {
        cliLogger.info(`  [${entry.targetId}] ${entry.remoteKey} (${entry.contentType}, ${entry.cacheControl})`);
    }
}

function logUploadSummary(result: UploadResult): void {
    for (const [targetId, count] of Object.entries(result.uploadedByTarget)) {
        cliLogger.info(`Uploaded ${count} files for target "${targetId}"`);
    }
    cliLogger.info(`Uploaded ${result.totalUploaded} files total`);
}

export async function runStaticAssetUpload(
    config: StaticAssetsConfig,
    options: StaticAssetUploadOptions = {},
): Promise<UploadResult> {
    const baseDir = options.baseDir ?? process.cwd();
    const resolved = resolveStaticAssetsConfig(config, baseDir);
    const plan = resolveUploadPlan(resolved, baseDir);
    assertRequiredTargets(plan, resolved);

    if (plan.entries.length === 0) {
        cliLogger.warn('Upload plan is empty — no files matched manifest targets');
    }

    const dryRun = Boolean(options.dryRun);
    if (dryRun) {
        logDryRunPlan(plan);
        return { uploadedByTarget: {}, totalUploaded: 0 };
    }

    cliLogger.info(`Uploading static assets to s3://${plan.bucket}/ (commit ${plan.commit})`);

    const client = options.client ?? createS3Client(resolved);
    const result = await new S3UploadProvider(client).upload(plan, { dryRun: false });
    logUploadSummary(result);
    return result;
}
