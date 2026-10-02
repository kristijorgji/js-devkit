import { existsSync } from 'node:fs';
import { basename, relative, resolve } from 'node:path';

import { expandPlaceholders, resolveStaticAssetsConfig } from '../config/load-config.js';
import type {
    ResolvedStaticAssetsConfig,
    StaticAssetTarget,
    StaticAssetsConfig,
    UploadPlan,
    UploadPlanEntry,
} from '../config/types.js';
import { walkFiles } from '../fs/walk-files.js';
import { matchesAnyGlob } from '../glob/match.js';
import { contentTypeForFileName } from '../mime/content-type.js';

function shouldIncludeFile(relativePath: string, target: StaticAssetTarget): boolean {
    if (target.exclude?.length && matchesAnyGlob(relativePath, target.exclude)) {
        return false;
    }
    if (target.include?.length) {
        return matchesAnyGlob(relativePath, target.include);
    }
    return true;
}

function resolveTargetEntries(
    config: ResolvedStaticAssetsConfig,
    target: StaticAssetTarget,
): UploadPlanEntry[] {
    const localDirectory = resolve(config.root, target.localDir);
    if (!existsSync(localDirectory)) {
        if (target.optional) {
            return [];
        }
        throw new Error(`Missing required directory: ${localDirectory}`);
    }

    const remotePrefix = expandPlaceholders(target.remotePrefix, {
        commit: config.commit,
        commitPrefix: config.commitPrefix,
        sharedPrefix: config.sharedPrefix,
    }).replace(/\/$/, '');
    const entries: UploadPlanEntry[] = [];

    for (const filePath of walkFiles(localDirectory)) {
        const relativePath = relative(localDirectory, filePath).split('\\').join('/');
        if (!shouldIncludeFile(relativePath, target)) {
            continue;
        }

        entries.push({
            targetId: target.id,
            localPath: filePath,
            remoteKey: `${remotePrefix}/${relativePath}`,
            contentType: contentTypeForFileName(basename(relativePath)),
            cacheControl: target.cacheControl,
        });
    }

    return entries;
}

export function resolveUploadPlan(config: StaticAssetsConfig, baseDir: string = process.cwd()): UploadPlan {
    const resolved = resolveStaticAssetsConfig(config, baseDir);

    const entries: UploadPlanEntry[] = [];
    for (const target of resolved.targets) {
        if (resolved.targetIds && !resolved.targetIds.includes(target.id)) {
            continue;
        }
        entries.push(...resolveTargetEntries(resolved, target));
    }

    return {
        bucket: resolved.bucket,
        region: resolved.region,
        commit: resolved.commit,
        entries,
    };
}

export function assertRequiredTargets(plan: UploadPlan, config: StaticAssetsConfig): void {
    const requiredTargetIds = config.requiredTargetIds ?? [];
    const knownIds = new Set(config.targets.map((target) => target.id));
    for (const targetId of requiredTargetIds) {
        if (!knownIds.has(targetId)) {
            throw new Error(`Unknown required upload target: ${targetId}`);
        }
        const count = plan.entries.filter((entry) => entry.targetId === targetId).length;
        if (count === 0) {
            throw new Error(`Required upload target "${targetId}" produced no files`);
        }
    }
}
