import { existsSync, readFileSync } from 'node:fs';
import { dirname, isAbsolute, join, resolve } from 'node:path';

import { createJiti } from 'jiti';

import { normalizeAppPath } from '../snapshot/normalize-app-path.js';

import type { BundleBudgetConfig, BundleBudgetsFile, ResolvedBundleBudgetConfig } from './types.js';

const CONFIG_FILENAMES = [
    'next-bundle-budget.config.ts',
    'next-bundle-budget.config.mts',
    'next-bundle-budget.config.js',
    'next-bundle-budget.config.mjs',
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

export function resolveBundleBudgetConfig(config: BundleBudgetConfig): ResolvedBundleBudgetConfig {
    const appRoot = resolve(config.appRoot);
    return {
        appRoot,
        distDir: config.distDir ? resolve(appRoot, config.distDir) : join(appRoot, '.next'),
        adapter: config.adapter ?? 'auto',
        historyDir: resolve(appRoot, config.historyDir ?? 'docs/generated/bundle-size'),
        budgetsFile: resolve(appRoot, config.budgetsFile ?? 'bundle-budgets.json'),
        extraGroups: config.extraGroups ?? [],
        resolveRouteName: config.resolveRouteName ?? ((manifestKey) => normalizeAppPath(manifestKey)),
        strictRoutes: config.strictRoutes ?? true,
        buildCommand: config.buildCommand ?? ['pnpm', 'exec', 'next', 'build'],
        prebuildCommands: config.prebuildCommands ?? [],
        hintCommand: config.hintCommand ?? 'kj-next-bundle sync-limits',
    };
}

export async function loadConfig(cwd: string = process.cwd()): Promise<ResolvedBundleBudgetConfig> {
    const configPath = findConfigFile(cwd);
    if (!configPath) {
        throw new Error(
            `No next-bundle-budget.config.ts found from ${cwd}. Create one with defineBundleBudgetConfig().`,
        );
    }

    const jiti = createJiti(import.meta.url);
    const loaded = (await jiti.import(configPath)) as { default?: BundleBudgetConfig } & BundleBudgetConfig;
    const config = loaded.default ?? loaded;
    if (!config.appRoot) {
        throw new Error(`${configPath} must export a config with appRoot`);
    }
    return resolveBundleBudgetConfig(config);
}

export function loadBudgetsFile(path: string): BundleBudgetsFile {
    if (!existsSync(path)) {
        throw new Error(`Budget file not found: ${path}`);
    }
    const parsed = JSON.parse(readFileSync(path, 'utf8')) as BundleBudgetsFile;
    return {
        groups: parsed.groups ?? {},
        routes: parsed.routes ?? {},
    };
}

export function resolvePath(base: string, maybeRelative: string): string {
    return isAbsolute(maybeRelative) ? maybeRelative : resolve(base, maybeRelative);
}
