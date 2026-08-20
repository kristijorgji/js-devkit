import { next15Adapter } from './next15.js';
import { next16Adapter } from './next16.js';
import type { AdapterId, NextRouteBuildAdapter } from './types.js';

const REGISTRY: NextRouteBuildAdapter[] = [next16Adapter, next15Adapter];

export const fallbackAdapter: NextRouteBuildAdapter = {
    id: 'next16',
    capabilities: { prerenderManifest: false },
    detect: () => true,
    loadPrerenderInfo: () => null,
};

export function getAdapterById(id: AdapterId): NextRouteBuildAdapter {
    const found = REGISTRY.find((adapter) => adapter.id === id);
    if (!found) {
        throw new Error(`Unknown route-docs adapter: ${id}`);
    }
    return found;
}

export function detectAdapter(distDir: string, explicit: 'auto' | AdapterId = 'auto'): NextRouteBuildAdapter {
    if (explicit !== 'auto') {
        return getAdapterById(explicit);
    }
    return REGISTRY.find((adapter) => adapter.detect({ distDir })) ?? fallbackAdapter;
}
