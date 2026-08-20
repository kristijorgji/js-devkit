import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

import { createJiti } from 'jiti';

import type { ResolvedRouteDocsConfig, RouteDocsConfig, RouteDocsOutput } from './types.js';

const CONFIG_FILENAMES = [
    'next-route-docs.config.ts',
    'next-route-docs.config.mts',
    'next-route-docs.config.js',
    'next-route-docs.config.mjs',
];

const DEFAULT_OUTPUTS: RouteDocsOutput[] = ['markdown', 'json', 'html'];

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

function resolveAppDir(appRoot: string, configured?: string): string {
    if (configured) return resolve(appRoot, configured);
    const srcApp = join(appRoot, 'src/app');
    if (existsSync(srcApp)) return srcApp;
    return join(appRoot, 'app');
}

export function resolveRouteDocsConfig(config: RouteDocsConfig): ResolvedRouteDocsConfig {
    if (!config.appRoot) {
        throw new Error('next-route-docs config must set appRoot');
    }
    const appRoot = resolve(config.appRoot);
    return {
        appRoot,
        appDir: resolveAppDir(appRoot, config.appDir),
        publicDir: config.publicDir ? resolve(appRoot, config.publicDir) : join(appRoot, 'public'),
        distDir: config.distDir ? resolve(appRoot, config.distDir) : join(appRoot, '.next'),
        outDir: config.outDir ? resolve(appRoot, config.outDir) : join(appRoot, 'docs'),
        basename: config.basename?.trim() || 'routes',
        outputs: config.outputs && config.outputs.length > 0 ? config.outputs : DEFAULT_OUTPUTS,
        viewerTitle: config.viewerTitle?.trim() || 'Routes',
        adapter: config.adapter ?? 'auto',
        locales: config.locales ?? [],
        localeParam: config.localeParam?.trim() || 'locale',
        resolveRouteName: config.resolveRouteName ?? (() => null),
        resolveLocalizedPath: config.resolveLocalizedPath ?? (() => null),
        resolveAuth: config.resolveAuth ?? (() => null),
        resolveIndexable: config.resolveIndexable ?? (() => null),
        describe: config.describe ?? (() => undefined),
        ignorePublicPaths: config.ignorePublicPaths ?? [],
        formatMarkdown: config.formatMarkdown ?? ((markdown) => markdown),
    };
}

export async function loadConfig(cwd: string = process.cwd()): Promise<ResolvedRouteDocsConfig> {
    const configPath = findConfigFile(cwd);
    if (!configPath) {
        throw new Error(`No next-route-docs.config.ts found from ${cwd}. Create one with defineRouteDocsConfig().`);
    }

    const jiti = createJiti(import.meta.url);
    const loaded = (await jiti.import(configPath)) as { default?: RouteDocsConfig } & RouteDocsConfig;
    const config = loaded.default ?? loaded;
    if (!config.appRoot) {
        throw new Error(`${configPath} must export a config with appRoot`);
    }
    return resolveRouteDocsConfig(config);
}
