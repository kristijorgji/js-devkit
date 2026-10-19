import { existsSync } from 'node:fs';
import { dirname, isAbsolute, join, resolve } from 'node:path';

import { createJiti } from 'jiti';

import { resolvePackageManager } from '../package-manager.js';

import type { QualityGatesConfig, ResolvedQualityGatesConfig } from './types.js';

const CONFIG_FILENAMES = [
    'quality-gates.config.ts',
    'quality-gates.config.mts',
    'quality-gates.config.js',
    'quality-gates.config.mjs',
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

export function resolveQualityGatesConfig(
    config: QualityGatesConfig,
    cwd: string,
): ResolvedQualityGatesConfig {
    if (!config.gates?.length) {
        throw new Error('quality-gates config must set gates');
    }
    const ids = config.gates.map((gate) => gate.id);
    const duplicates = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
    if (duplicates.length > 0) {
        throw new Error(`quality-gates config has duplicate gate ids: ${duplicates.join(', ')}`);
    }
    const packageManager = resolvePackageManager(config.packageManager ?? 'auto', cwd);
    return {
        packageManager,
        packageRoots: config.packageRoots ?? ['apps', 'packages'],
        logDir: config.logDir ?? '.quality-gates',
        workingTreeScript: config.workingTreeScript ?? packageManager.formatScript('quality:working-tree'),
        gates: config.gates,
    };
}

export async function loadConfig(
    cwd: string = process.cwd(),
    options: { configPath?: string } = {},
): Promise<ResolvedQualityGatesConfig> {
    const configPath = options.configPath
        ? isAbsolute(options.configPath)
            ? options.configPath
            : resolve(cwd, options.configPath)
        : findConfigFile(cwd);
    if (!configPath) {
        throw new Error(`No quality-gates.config.ts found from ${cwd}. Create one with defineQualityGatesConfig().`);
    }
    if (!existsSync(configPath)) {
        throw new Error(`quality-gates config not found: ${configPath}`);
    }

    const jiti = createJiti(import.meta.url);
    const loaded = (await jiti.import(configPath)) as { default?: QualityGatesConfig } & QualityGatesConfig;
    const config = loaded.default ?? loaded;
    return resolveQualityGatesConfig(config, cwd);
}
