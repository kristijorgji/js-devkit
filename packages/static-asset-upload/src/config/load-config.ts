import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

import { createJiti } from 'jiti';

import type { ResolvedStaticAssetsConfig, StaticAssetsConfig } from './types.js';

const CONFIG_FILENAMES = [
    'static-assets.config.ts',
    'static-assets.config.mts',
    'static-assets.config.js',
    'static-assets.config.mjs',
];

const DEFAULT_REGION = 'us-east-1';

export function findConfigFile(startDir: string): string | null {
    let current = resolve(startDir);
    while (true) {
        for (const filename of CONFIG_FILENAMES) {
            const candidate = join(current, filename);
            if (existsSync(candidate)) {
                return candidate;
            }
        }
        const parent = dirname(current);
        if (parent === current) {
            return null;
        }
        current = parent;
    }
}

export function expandPlaceholders(template: string, vars: Record<string, string>): string {
    return template.replace(/\{(\w+)\}/g, (match, key: string) => vars[key] ?? match);
}

export function resolveStaticAssetsConfig(
    config: StaticAssetsConfig,
    baseDir: string = process.cwd(),
): ResolvedStaticAssetsConfig {
    if (!config.root?.trim()) {
        throw new Error('static-assets config must set root');
    }
    if (!config.bucket?.trim()) {
        throw new Error('static-assets config must set bucket');
    }
    if (!config.commit?.trim()) {
        throw new Error('static-assets config must set commit');
    }
    if (!config.commitPrefix?.trim()) {
        throw new Error('static-assets config must set commitPrefix');
    }
    if (!config.sharedPrefix?.trim()) {
        throw new Error('static-assets config must set sharedPrefix');
    }
    if (!config.targets?.length) {
        throw new Error('static-assets config must set targets');
    }

    config.validateCommit?.(config.commit);

    const commitVars = { commit: config.commit };
    const commitPrefix = expandPlaceholders(config.commitPrefix, commitVars).replace(/\/$/, '');
    const sharedPrefix = expandPlaceholders(config.sharedPrefix, commitVars).replace(/\/$/, '');

    return {
        root: resolve(baseDir, config.root),
        bucket: config.bucket,
        region: config.region?.trim() || DEFAULT_REGION,
        commit: config.commit,
        endpoint: config.endpoint?.trim() || undefined,
        forcePathStyle: Boolean(config.forcePathStyle),
        commitPrefix,
        sharedPrefix,
        targets: config.targets,
        targetIds: config.targetIds,
        requiredTargetIds: config.requiredTargetIds ?? [],
    };
}

export async function loadConfig(cwd: string = process.cwd()): Promise<ResolvedStaticAssetsConfig> {
    const configPath = findConfigFile(cwd);
    if (!configPath) {
        throw new Error(
            `No static-assets.config.ts found from ${cwd}. Create one with defineStaticAssetsConfig().`,
        );
    }

    const jiti = createJiti(import.meta.url);
    const loaded = (await jiti.import(configPath)) as { default?: StaticAssetsConfig } & StaticAssetsConfig;
    const config = loaded.default ?? loaded;
    return resolveStaticAssetsConfig(config, dirname(configPath));
}
