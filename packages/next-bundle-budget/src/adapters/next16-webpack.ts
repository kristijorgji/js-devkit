import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { readBuildManifest, readSharedBaselineFromManifest } from './manifest.js';
import { next15WebpackAdapter } from './next15-webpack.js';
import type { ChunkGroup, NextBuildOutputAdapter, PageOwnedChunks, SharedVendorChunk } from './types.js';

function readBuildId(distDir: string): string | null {
    const path = join(distDir, 'BUILD_ID');
    if (!existsSync(path)) {
        return null;
    }
    return readFileSync(path, 'utf8').trim() || null;
}

export const next16WebpackAdapter: NextBuildOutputAdapter = {
    id: 'next16-webpack',
    capabilities: { perRouteChunks: false, namedRuntimeChunks: true },
    detect(ctx: { distDir: string }): boolean {
        return (
            existsSync(join(ctx.distDir, 'build-manifest.json')) &&
            !existsSync(join(ctx.distDir, 'app-build-manifest.json'))
        );
    },
    readBuildId,
    readSharedBaseline(distDir: string): string[] {
        return readSharedBaselineFromManifest(readBuildManifest(distDir));
    },
    listChunkGroups(distDir: string): ChunkGroup[] {
        return next15WebpackAdapter.listChunkGroups(distDir);
    },
    listPageOwnedChunks(_distDir: string): PageOwnedChunks[] {
        return [];
    },
    resolveMiddlewarePath(distDir: string): string | null {
        return next15WebpackAdapter.resolveMiddlewarePath(distDir);
    },
    listSharedVendorChunks(distDir: string): SharedVendorChunk[] {
        return next15WebpackAdapter.listSharedVendorChunks(distDir);
    },
};
