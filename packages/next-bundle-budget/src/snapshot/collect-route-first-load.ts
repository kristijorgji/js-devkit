import { existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { detectAdapter } from '../adapters/detect.js';
import { collectAncestorLayoutKeys, readAppBuildManifest, readBuildManifest } from '../adapters/manifest.js';
import { normalizeAppPath } from './normalize-app-path.js';
import type { AppRouteFirstLoad } from './types.js';

const SKIPPED_PAGE_KEYS = new Set(['/_not-found/page']);

function sumChunkSizes(distDir: string, chunkPaths: string[], cache: Map<string, number>): number {
    let total = 0;

    for (const chunkPath of chunkPaths) {
        const cached = cache.get(chunkPath);
        if (cached !== undefined) {
            total += cached;
            continue;
        }

        const absolutePath = join(distDir, chunkPath);
        if (!existsSync(absolutePath)) {
            continue;
        }

        const size = statSync(absolutePath).size;
        cache.set(chunkPath, size);
        total += size;
    }

    return total;
}

/** First-load JS: shared + ancestor layouts + page chunks (Next 15 webpack). */
export function collectAppRouteFirstLoad(distDir: string): AppRouteFirstLoad[] {
    const appManifest = readAppBuildManifest(distDir);
    const buildManifest = readBuildManifest(distDir);

    if (!appManifest || !buildManifest) {
        const adapter = detectAdapter(distDir, 'auto');
        if (!adapter.capabilities.perRouteChunks) {
            return [];
        }
        const cache = new Map<string, number>();
        return adapter
            .listPageOwnedChunks(distDir)
            .map((page) => ({
                route: page.normalizedPath,
                firstLoadUncompressedJsBytes: sumChunkSizes(distDir, page.chunkPaths, cache),
                firstLoadChunkPaths: page.chunkPaths,
            }))
            .sort(
                (left, right) =>
                    right.firstLoadUncompressedJsBytes - left.firstLoadUncompressedJsBytes ||
                    left.route.localeCompare(right.route),
            );
    }

    const pageEntries = appManifest.pages ?? {};
    const manifestKeys = new Set(Object.keys(pageEntries));
    const sharedChunks: string[] = [...(buildManifest.polyfillFiles ?? []), ...(buildManifest.rootMainFiles ?? [])];
    const cache = new Map<string, number>();
    const rows: AppRouteFirstLoad[] = [];

    for (const pageAppPath of manifestKeys) {
        if (!pageAppPath.endsWith('/page') || SKIPPED_PAGE_KEYS.has(pageAppPath)) {
            continue;
        }

        const layoutKeys = collectAncestorLayoutKeys(pageAppPath, manifestKeys);
        const chunkPaths: string[] = [
            ...new Set(
                [
                    ...sharedChunks,
                    ...layoutKeys.flatMap((layoutKey) => pageEntries[layoutKey] ?? []),
                    ...(pageEntries[pageAppPath] ?? []),
                ].filter((chunkPath) => chunkPath.endsWith('.js')),
            ),
        ];

        rows.push({
            route: normalizeAppPath(pageAppPath),
            firstLoadUncompressedJsBytes: sumChunkSizes(distDir, chunkPaths, cache),
            firstLoadChunkPaths: chunkPaths,
        });
    }

    return rows.sort(
        (left, right) =>
            right.firstLoadUncompressedJsBytes - left.firstLoadUncompressedJsBytes ||
            left.route.localeCompare(right.route),
    );
}
