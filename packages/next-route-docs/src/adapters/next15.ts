import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { hasPrerenderManifest, readPrerenderManifest } from './load-prerender-info.js';
import type { NextRouteBuildAdapter } from './types.js';

export const next15Adapter: NextRouteBuildAdapter = {
    id: 'next15',
    capabilities: { prerenderManifest: true },
    detect({ distDir }) {
        return hasPrerenderManifest(distDir) && !existsSync(join(distDir, 'diagnostics'));
    },
    loadPrerenderInfo(distDir) {
        return readPrerenderManifest(distDir);
    },
};
