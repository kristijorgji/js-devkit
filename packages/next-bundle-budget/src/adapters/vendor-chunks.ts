import { existsSync, readdirSync, statSync } from 'node:fs';
import { basename, join } from 'node:path';

import { escapeSizeLimitGlobPath } from '../size-limit/limit-format.js';

import { readBuildManifest } from './manifest.js';
import type { SharedVendorChunk } from './types.js';

const STABLE_RUNTIME_PREFIXES: string[] = ['framework-', 'main-', 'polyfills-', 'webpack-'];

/** Webpack vendor/async chunks: numeric or hex id prefix before content hash. */
const VENDOR_CHUNK_ID_PATTERN = /^([a-f0-9]+)-.+\.js$/;

export function isVendorChunkFilename(filename: string): boolean {
    if (!filename.endsWith('.js')) {
        return false;
    }
    if (STABLE_RUNTIME_PREFIXES.some((prefix) => filename.startsWith(prefix))) {
        return false;
    }
    return VENDOR_CHUNK_ID_PATTERN.test(filename);
}

export function extractVendorChunkId(filename: string): string {
    const match = filename.match(VENDOR_CHUNK_ID_PATTERN);
    return match?.[1] ?? filename.replace(/\.js$/, '');
}

export function buildVendorChunkGlobPath(chunkId: string): string {
    return `.next/static/chunks/${chunkId}-*.js`;
}

export function readRootMainVendorChunkFilenames(distDir: string): string[] {
    const manifest = readBuildManifest(distDir);
    const rootMainFiles = manifest?.rootMainFiles ?? [];
    return rootMainFiles.map((chunkPath) => basename(chunkPath)).filter((filename) => isVendorChunkFilename(filename));
}

export function resolveSharedVendorChunks(distDir: string): SharedVendorChunk[] {
    const chunksDir = join(distDir, 'static/chunks');
    const filenames = readRootMainVendorChunkFilenames(distDir);
    if (filenames.length === 0 || !existsSync(chunksDir)) {
        return [];
    }

    return filenames
        .map((filename) => {
            const filePath = join(chunksDir, filename);
            if (!existsSync(filePath)) {
                return null;
            }
            return {
                id: extractVendorChunkId(filename),
                filename,
                sizeBytes: statSync(filePath).size,
                globPath: buildVendorChunkGlobPath(extractVendorChunkId(filename)),
            };
        })
        .filter((chunk): chunk is SharedVendorChunk => chunk !== null)
        .sort((left, right) => right.sizeBytes - left.sizeBytes || left.id.localeCompare(right.id));
}

export function resolveAsyncChunkPaths(distDir: string): string[] {
    const chunksDir = join(distDir, 'static/chunks');
    if (!existsSync(chunksDir)) {
        return [];
    }

    return readdirSync(chunksDir)
        .filter((filename) => isVendorChunkFilename(filename))
        .sort((left, right) => left.localeCompare(right))
        .map((filename) => escapeSizeLimitGlobPath(`.next/static/chunks/${filename}`));
}

export function formatSharedVendorRankMap(chunks: SharedVendorChunk[]): string {
    if (chunks.length === 0) {
        return 'none';
    }
    return chunks.map((chunk, index) => `#${index + 1}=${chunk.id}`).join(', ');
}
