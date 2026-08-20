import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { PrerenderInfo } from './types.js';

export function readPrerenderManifest(distDir: string): PrerenderInfo | null {
    const path = join(distDir, 'prerender-manifest.json');
    if (!existsSync(path)) {
        return null;
    }
    try {
        const raw = JSON.parse(readFileSync(path, 'utf8')) as PrerenderInfo;
        return {
            routes: raw.routes ?? {},
            dynamicRoutes: raw.dynamicRoutes ?? {},
        };
    } catch {
        return null;
    }
}

export function hasPrerenderManifest(distDir: string): boolean {
    return existsSync(join(distDir, 'prerender-manifest.json'));
}
