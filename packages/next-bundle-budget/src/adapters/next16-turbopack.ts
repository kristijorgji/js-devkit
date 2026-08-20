import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, join } from 'node:path';

import { escapeSizeLimitGlobPath } from '../size-limit/limit-format.js';
import { normalizeAppPath } from '../snapshot/normalize-app-path.js';

import { readBuildManifest, readJsonFile, readSharedBaselineFromManifest } from './manifest.js';
import type { ChunkGroup, NextBuildOutputAdapter, PageOwnedChunks, SharedVendorChunk } from './types.js';

interface RouteBundleStat {
    route: string;
    firstLoadUncompressedJsBytes?: number;
    firstLoadChunkPaths?: string[];
}

interface MiddlewareManifest {
    middleware?: Record<string, { files?: string[]; filesManifest?: string[] }>;
}

interface FunctionsConfigManifest {
    functions?: Record<string, { runtime?: string }>;
}

function readBuildId(distDir: string): string | null {
    const path = join(distDir, 'BUILD_ID');
    if (!existsSync(path)) {
        return null;
    }
    return readFileSync(path, 'utf8').trim() || null;
}

function listHashedJsChunks(distDir: string): string[] {
    const chunksDir = join(distDir, 'static/chunks');
    if (!existsSync(chunksDir)) {
        return [];
    }
    return readdirSync(chunksDir)
        .filter((name) => name.endsWith('.js'))
        .sort((left, right) => left.localeCompare(right));
}

function hasTurbopackRuntime(distDir: string): boolean {
    return listHashedJsChunks(distDir).some((name) => name.startsWith('turbopack-'));
}

function resolveSharedVendorChunks(distDir: string): SharedVendorChunk[] {
    const manifest = readBuildManifest(distDir);
    const chunksDir = join(distDir, 'static/chunks');
    const rootMainFiles = manifest?.rootMainFiles ?? [];
    if (rootMainFiles.length === 0 || !existsSync(chunksDir)) {
        return [];
    }

    return rootMainFiles
        .map((chunkPath) => {
            const filename = basename(chunkPath);
            if (!filename.endsWith('.js') || filename.startsWith('turbopack-')) {
                return null;
            }
            const filePath = join(chunksDir, filename);
            if (!existsSync(filePath)) {
                return null;
            }
            return {
                id: filename.replace(/\.js$/, ''),
                filename,
                sizeBytes: statSync(filePath).size,
                globPath: escapeSizeLimitGlobPath(`.next/static/chunks/${filename}`),
            };
        })
        .filter((chunk): chunk is SharedVendorChunk => chunk !== null)
        .sort((left, right) => right.sizeBytes - left.sizeBytes || left.id.localeCompare(right.id));
}

function resolveMiddlewarePath(distDir: string): string | null {
    const rootPath = join(distDir, 'server/middleware.js');
    if (existsSync(rootPath)) {
        return '.next/server/middleware.js';
    }

    const middlewareManifest = readJsonFile<MiddlewareManifest>(join(distDir, 'server/middleware-manifest.json'));
    const files = Object.values(middlewareManifest?.middleware ?? {}).flatMap((entry) => entry.files ?? []);
    const firstJs = files.find((file) => file.endsWith('.js'));
    if (firstJs) {
        return `.next/${firstJs}`;
    }

    const functions = readJsonFile<FunctionsConfigManifest>(join(distDir, 'server/functions-config-manifest.json'));
    if (functions?.functions?.['/_middleware']) {
        if (existsSync(rootPath)) {
            return '.next/server/middleware.js';
        }
    }

    return null;
}

function listChunkGroups(distDir: string): ChunkGroup[] {
    const vendorChunks = resolveSharedVendorChunks(distDir);
    const allJs = listHashedJsChunks(distDir);
    const runtimeFiles = allJs.filter((name) => name.startsWith('turbopack-'));
    const vendorNames = new Set(vendorChunks.map((chunk) => chunk.filename));
    const asyncFiles = allJs.filter((name) => !name.startsWith('turbopack-') && !vendorNames.has(name));

    const groups: ChunkGroup[] = [];

    if (runtimeFiles.length > 0) {
        groups.push({
            id: 'runtime',
            label: 'Next turbopack runtime',
            paths: runtimeFiles.map((name) => escapeSizeLimitGlobPath(`.next/static/chunks/${name}`)),
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

    if (asyncFiles.length > 0) {
        groups.push({
            id: 'asyncChunks',
            label: 'Next async chunks (total)',
            paths: asyncFiles.map((name) => escapeSizeLimitGlobPath(`.next/static/chunks/${name}`)),
        });
    }

    const middlewarePath = resolveMiddlewarePath(distDir);
    if (middlewarePath) {
        groups.push({
            id: 'middleware',
            label: 'Edge middleware',
            paths: [middlewarePath],
        });
    }

    return groups;
}

function listPageOwnedChunks(distDir: string): PageOwnedChunks[] {
    const stats = readJsonFile<RouteBundleStat[]>(join(distDir, 'diagnostics/route-bundle-stats.json'));
    if (!stats) {
        return [];
    }

    return stats
        .filter((row) => row.route && (row.firstLoadChunkPaths?.length ?? 0) > 0)
        .map((row) => ({
            manifestKey: row.route,
            normalizedPath: normalizeAppPath(row.route),
            chunkPaths: row.firstLoadChunkPaths ?? [],
        }))
        .sort((left, right) => left.normalizedPath.localeCompare(right.normalizedPath));
}

export const next16TurbopackAdapter: NextBuildOutputAdapter = {
    id: 'next16-turbopack',
    capabilities: {
        perRouteChunks: true,
        namedRuntimeChunks: false,
    },
    detect(ctx: { distDir: string }): boolean {
        return (
            existsSync(join(ctx.distDir, 'diagnostics/route-bundle-stats.json')) || hasTurbopackRuntime(ctx.distDir)
        );
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
