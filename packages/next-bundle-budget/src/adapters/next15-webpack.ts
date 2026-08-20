import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { normalizeAppPath } from '../snapshot/normalize-app-path.js';

import {
    collectAncestorLayoutKeys,
    readAppBuildManifest,
    readBuildManifest,
    readSharedBaselineFromManifest,
} from './manifest.js';
import type { ChunkGroup, NextBuildOutputAdapter, PageOwnedChunks, SharedVendorChunk } from './types.js';
import { resolveAsyncChunkPaths, resolveSharedVendorChunks } from './vendor-chunks.js';

function readBuildId(distDir: string): string | null {
    const path = join(distDir, 'BUILD_ID');
    if (!existsSync(path)) {
        return null;
    }
    return readFileSync(path, 'utf8').trim() || null;
}

function listPageOwnedChunks(distDir: string): PageOwnedChunks[] {
    const appManifest = readAppBuildManifest(distDir);
    const buildManifest = readBuildManifest(distDir);
    if (!appManifest || !buildManifest) {
        return [];
    }

    const pageEntries = appManifest.pages ?? {};
    const manifestKeys = new Set(Object.keys(pageEntries));
    const sharedBaseline = new Set(readSharedBaselineFromManifest(buildManifest));
    const rows: PageOwnedChunks[] = [];

    for (const [manifestKey, chunkPaths] of Object.entries(pageEntries)) {
        if (!manifestKey.endsWith('/page')) {
            continue;
        }

        const layoutChunks = new Set(
            collectAncestorLayoutKeys(manifestKey, manifestKeys).flatMap((layoutKey) => pageEntries[layoutKey] ?? []),
        );

        rows.push({
            manifestKey,
            normalizedPath: normalizeAppPath(manifestKey),
            chunkPaths: [
                ...new Set(
                    chunkPaths.filter(
                        (chunkPath) =>
                            chunkPath.endsWith('.js') && !sharedBaseline.has(chunkPath) && !layoutChunks.has(chunkPath),
                    ),
                ),
            ],
        });
    }

    return rows.sort((left, right) => left.normalizedPath.localeCompare(right.normalizedPath));
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

function listChunkGroups(distDir: string): ChunkGroup[] {
    const vendorChunks = resolveSharedVendorChunks(distDir);
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
            paths: ['.next/static/chunks/app/**/*.js'],
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

export const next15WebpackAdapter: NextBuildOutputAdapter = {
    id: 'next15-webpack',
    capabilities: { perRouteChunks: true, namedRuntimeChunks: true },
    detect(ctx: { distDir: string }): boolean {
        return existsSync(join(ctx.distDir, 'app-build-manifest.json'));
    },
    readBuildId,
    readSharedBaseline(distDir: string): string[] {
        return readSharedBaselineFromManifest(readBuildManifest(distDir));
    },
    listChunkGroups,
    listPageOwnedChunks,
    resolveMiddlewarePath,
    listSharedVendorChunks(distDir: string): SharedVendorChunk[] {
        return resolveSharedVendorChunks(distDir);
    },
};
