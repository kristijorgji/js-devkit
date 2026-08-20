import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

import { createJiti } from 'jiti';

import { defaultAuthLabel } from '../openapi/security-index.js';
import type { OpenApiDocsConfig, OpenApiDocsOutput, ResolvedOpenApiDocsConfig, ResolvedPostmanOptions } from './types.js';

const CONFIG_FILENAMES = [
    'openapi-docs.config.ts',
    'openapi-docs.config.mts',
    'openapi-docs.config.js',
    'openapi-docs.config.mjs',
];

const DEFAULT_OUTPUTS: OpenApiDocsOutput[] = ['markdown', 'json', 'html'];

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

function resolvePostmanOptions(
    outDir: string,
    configured: OpenApiDocsConfig['postman'],
): ResolvedPostmanOptions {
    return {
        output: configured?.output
            ? resolve(configured.output)
            : join(outDir, 'postman.collection.json'),
        baseUrlVar: configured?.baseUrlVar?.trim() || 'baseApiUrl',
        baseUrlDefault: configured?.baseUrlDefault?.trim() || 'http://localhost:3000',
        accessTokenVar: configured?.accessTokenVar?.trim() || 'accessToken',
        refreshTokenVar: configured?.refreshTokenVar?.trim() || 'refreshToken',
        apiKeyVar: configured?.apiKeyVar?.trim() || 'apiKey',
        testLoginEmailVar: configured?.testLoginEmailVar?.trim() || 'testEmail',
        testLoginPasswordVar: configured?.testLoginPasswordVar?.trim() || 'testPassword',
        testLoginEmailDefault: configured?.testLoginEmailDefault ?? 'user@example.com',
        testLoginPasswordDefault: configured?.testLoginPasswordDefault ?? 'password',
        folderStrategy: configured?.folderStrategy === 'tags' ? 'tags' : 'paths',
        enableSecurityHeuristics: configured?.enableSecurityHeuristics === true,
        includeExamples: configured?.includeExamples === true,
        groupRootRoutes: configured?.groupRootRoutes !== false,
        groupAdminRoutes: configured?.groupAdminRoutes !== false,
        adminTag: configured?.adminTag?.trim() || 'Admin',
        authPaths: {
            login: configured?.authPaths?.login ?? ['login'],
            refresh: configured?.authPaths?.refresh ?? ['refresh'],
            logout: configured?.authPaths?.logout ?? ['logout'],
        },
        accessTokenJsonPath: configured?.accessTokenJsonPath?.trim() || 'data.tokens.accessToken',
        refreshTokenJsonPath: configured?.refreshTokenJsonPath?.trim() || 'data.tokens.refreshToken',
    };
}

export function resolveOpenApiDocsConfig(config: OpenApiDocsConfig, cwd: string = process.cwd()): ResolvedOpenApiDocsConfig {
    if (!config.document?.trim()) {
        throw new Error('openapi-docs config must set document');
    }
    const outDir = config.outDir ? resolve(cwd, config.outDir) : resolve(cwd, 'docs');
    return {
        document: resolve(cwd, config.document),
        outDir,
        basename: config.basename?.trim() || 'api-routes',
        outputs: config.outputs && config.outputs.length > 0 ? config.outputs : DEFAULT_OUTPUTS,
        viewerTitle: config.viewerTitle?.trim() || 'API routes',
        apiKeyHeaderName: config.apiKeyHeaderName?.trim() || 'X-API-Key',
        resolveAuthLabel: config.resolveAuthLabel ?? ((_op, security) => defaultAuthLabel(security)),
        resolvePermissions: config.resolvePermissions ?? (() => []),
        describe: config.describe ?? ((op) => op.summary),
        footnotes: config.footnotes ?? [],
        formatMarkdown: config.formatMarkdown ?? ((markdown) => markdown),
        postman: resolvePostmanOptions(outDir, config.postman),
    };
}

export async function loadConfig(cwd: string = process.cwd()): Promise<ResolvedOpenApiDocsConfig> {
    const configPath = findConfigFile(cwd);
    if (!configPath) {
        throw new Error(`No openapi-docs.config.ts found from ${cwd}. Create one with defineOpenApiDocsConfig().`);
    }

    const jiti = createJiti(import.meta.url);
    const loaded = (await jiti.import(configPath)) as { default?: OpenApiDocsConfig } & OpenApiDocsConfig;
    const config = loaded.default ?? loaded;
    if (!config.document) {
        throw new Error(`${configPath} must export a config with document`);
    }
    return resolveOpenApiDocsConfig(config, dirname(configPath));
}
