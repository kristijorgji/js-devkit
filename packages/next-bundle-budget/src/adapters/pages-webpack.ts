import { existsSync, readFileSync, statSync } from 'node:fs';
import { basename, join } from 'node:path';

import { escapeSizeLimitGlobPath } from '../size-limit/limit-format.js';
import { normalizeAppPath } from '../snapshot/normalize-app-path.js';

import { readBuildManifest, readSharedBaselineFromManifest } from './manifest.js';
import type { ChunkGroup, NextBuildOutputAdapter, PageOwnedChunks, SharedVendorChunk } from './types.js';
import { extractVendorChunkId, isVendorChunkFilename, resolveAsyncChunkPaths } from './vendor-chunks.js';

const SKIPPED_PAGE_KEYS = new Set(['/_app', '/_error', '/_document']);
const RUNTIME_PREFIXES = ['framework-', 'main-', 'polyfills-', 'webpack-'];

function readBuildId(distDir: string): string | null {
    const path = join(distDir, 'BUILD_ID');
    if (!existsSync(path)) {
        return null;
    }
    return readFileSync(path, 'utf8').trim() || null;
}

function isPagesRouterKey(manifestKey: string): boolean {
    return manifestKey === '/_app' || !manifestKey.endsWith('/page');
}

export function hasPagesRouterKeys(pages: Record<string, string[]> | undefined): boolean {
    if (!pages) {
        return false;
    }
    return Object.keys(pages).some((manifestKey) => isPagesRouterKey(manifestKey));
}

function resolveMiddlewarePath(distDir: string): string | null {
    const srcPath = join(distDir, 'server/src/middleware.js');
    if (existsSync(srcPath)) {
        return '.next/server/src/middleware.js';
    }
    const rootPath = join(distDir, 'server/middleware.js');
    if (existsSync(rootPath)) {
        return '.next/server/middleware.js';
    }
    return null;
}

function isRuntimeChunk(chunkPath: string): boolean {
    const filename = basename(chunkPath);
    return RUNTIME_PREFIXES.some((prefix) => filename.startsWith(prefix));
}

function isPageChunk(chunkPath: string): boolean {
    return chunkPath.includes('/pages/');
}

function listPageOwnedChunks(distDir: string): PageOwnedChunks[] {
    const manifest = readBuildManifest(distDir);
    const pageEntries = manifest?.pages ?? {};
    const appFiles = new Set(pageEntries['/_app'] ?? []);
    const polyfills = new Set(manifest?.polyfillFiles ?? []);
    const rows: PageOwnedChunks[] = [];

    for (const [manifestKey, chunkPaths] of Object.entries(pageEntries)) {
        if (SKIPPED_PAGE_KEYS.has(manifestKey)) {
            continue;
        }

        rows.push({
            manifestKey,
            normalizedPath: normalizeAppPath(manifestKey),
            chunkPaths: [
                ...new Set(
                    chunkPaths.filter(
                        (chunkPath) =>
                            chunkPath.endsWith('.js') && !appFiles.has(chunkPath) && !polyfills.has(chunkPath),
                    ),
                ),
            ],
        });
    }

    return rows.sort((left, right) => left.normalizedPath.localeCompare(right.normalizedPath));
}

function listSharedVendorChunks(distDir: string): SharedVendorChunk[] {
    const pageEntries = readBuildManifest(distDir)?.pages ?? {};
    const appFiles = pageEntries['/_app'] ?? [];

    return appFiles
        .filter((chunkPath) => chunkPath.endsWith('.js') && !isRuntimeChunk(chunkPath) && !isPageChunk(chunkPath))
        .map((chunkPath) => {
            const filename = basename(chunkPath);
            const absolutePath = join(distDir, chunkPath);
            if (!existsSync(absolutePath)) {
                return null;
            }
            const id = isVendorChunkFilename(filename) ? extractVendorChunkId(filename) : filename.replace(/\.js$/, '');
            return {
                id,
                filename,
                sizeBytes: statSync(absolutePath).size,
                globPath: isVendorChunkFilename(filename)
                    ? `.next/static/chunks/${id}-*.js`
                    : escapeSizeLimitGlobPath(`.next/static/chunks/${filename}`),
            };
        })
        .filter((chunk): chunk is SharedVendorChunk => chunk !== null)
        .sort((left, right) => right.sizeBytes - left.sizeBytes || left.id.localeCompare(right.id));
}

function listChunkGroups(distDir: string): ChunkGroup[] {
    const vendorChunks = listSharedVendorChunks(distDir);
    const asyncPaths = resolveAsyncChunkPaths(distDir);
    const middlewarePath = resolveMiddlewarePath(distDir);

    const groups: ChunkGroup[] = [
        {
            id: 'framework',
            label: 'Next framework',
            paths: ['.next/static/chunks/framework-*.js'],
        },
        {
            id: 'main',
            label: 'Next main',
            paths: ['.next/static/chunks/main-*.js'],
        },
        {
            id: 'polyfills',
            label: 'Next polyfills',
            paths: ['.next/static/chunks/polyfills-*.js'],
        },
        {
            id: 'webpackRuntime',
            label: 'Next webpack runtime',
            paths: ['.next/static/chunks/webpack-*.js'],
        },
        {
            id: 'asyncChunks',
            label: 'Next async chunks (total)',
            paths: asyncPaths,
        },
        {
            id: 'appRouteChunks',
            label: 'Next app route chunks (total)',
            paths: ['.next/static/chunks/pages/**/*.js'],
        },
    ];

    if (middlewarePath) {
        groups.push({
            id: 'middleware',
            label: 'Edge middleware',
            paths: [middlewarePath],
        });
    }

    vendorChunks.forEach((chunk, index) => {
        groups.push({
            id: `sharedVendor${index + 1}`,
            label: `Next shared chunk #${index + 1}`,
            paths: [chunk.globPath],
        });
    });

    if (vendorChunks.length > 0) {
        groups.push({
            id: 'sharedVendorTotal',
            label: 'Next shared chunks (total)',
            paths: vendorChunks.map((chunk) => chunk.globPath),
        });
    }

    return groups;
}

export const pagesWebpackAdapter: NextBuildOutputAdapter = {
    id: 'pages-webpack',
    capabilities: { perRouteChunks: true, namedRuntimeChunks: true },
    detect(ctx: { distDir: string }): boolean {
        return (
            existsSync(join(ctx.distDir, 'build-manifest.json')) &&
            !existsSync(join(ctx.distDir, 'app-build-manifest.json')) &&
            hasPagesRouterKeys(readBuildManifest(ctx.distDir)?.pages)
        );
    },
    readBuildId,
    readSharedBaseline(distDir: string): string[] {
        return readSharedBaselineFromManifest(readBuildManifest(distDir));
    },
    listChunkGroups,
    listPageOwnedChunks,
    resolveMiddlewarePath,
    listSharedVendorChunks,
};
