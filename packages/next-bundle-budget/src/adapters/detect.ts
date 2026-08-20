import { next15WebpackAdapter } from './next15-webpack.js';
import { next16TurbopackAdapter } from './next16-turbopack.js';
import { next16WebpackAdapter } from './next16-webpack.js';
import type { AdapterId, NextBuildOutputAdapter } from './types.js';

const ADAPTERS: NextBuildOutputAdapter[] = [next16TurbopackAdapter, next15WebpackAdapter, next16WebpackAdapter];

export function getAdapterById(id: AdapterId): NextBuildOutputAdapter {
    const adapter = ADAPTERS.find((candidate) => candidate.id === id);
    if (!adapter) {
        throw new Error(`Unknown adapter: ${id}`);
    }
    return adapter;
}

export function detectAdapter(distDir: string, explicit?: 'auto' | AdapterId): NextBuildOutputAdapter {
    if (explicit && explicit !== 'auto') {
        return getAdapterById(explicit);
    }

    const matched = ADAPTERS.find((adapter) => adapter.detect({ distDir }));
    if (!matched) {
        throw new Error(`Could not detect a Next.js build adapter in ${distDir}. Run a production build first.`);
    }
    return matched;
}

export { next15WebpackAdapter, next16TurbopackAdapter, next16WebpackAdapter };
