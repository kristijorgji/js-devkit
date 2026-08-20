import { collectAppRouteFirstLoad } from './collect-route-first-load.js';
import { collectGitMetadata } from './collect-git-metadata.js';
import { collectSizeLimitBudgets } from './collect-size-limit-budgets.js';
import type { BundleSnapshot } from './types.js';

export function collectBundleSnapshot(appRoot: string, distDir: string): BundleSnapshot {
    const git = collectGitMetadata(appRoot);

    return {
        ...git,
        timestamp: new Date().toISOString(),
        budgets: collectSizeLimitBudgets(appRoot),
        routes: collectAppRouteFirstLoad(distDir),
    };
}
