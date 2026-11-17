import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

import { createJiti } from 'jiti';

import { resolveSeoAuditConfig } from './resolve-config.js';
import type { ResolvedSeoAuditConfig, SeoAuditConfig } from './types.js';

const CONFIG_FILENAMES = [
    'seo-audit.config.ts',
    'seo-audit.config.mts',
    'seo-audit.config.js',
    'seo-audit.config.mjs',
];

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

export async function loadConfig(cwd: string = process.cwd()): Promise<ResolvedSeoAuditConfig> {
    const configPath = findConfigFile(cwd);
    if (!configPath) {
        return resolveSeoAuditConfig({}, cwd);
    }

    const jiti = createJiti(import.meta.url);
    const loaded = (await jiti.import(configPath)) as { default?: SeoAuditConfig } & SeoAuditConfig;
    const config = loaded.default ?? loaded;
    return resolveSeoAuditConfig(config, dirname(configPath));
}
