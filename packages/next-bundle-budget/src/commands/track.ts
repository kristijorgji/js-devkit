import { cliLogger } from '@kristijorgji/cli-kit';

import type { ResolvedBundleBudgetConfig } from '../config/types.js';
import { computeStaticLimitUpdates } from './sync-limits.js';
import { computeBundleComparison } from '../history/compute-diff.js';
import { hasBundleGrowth } from '../history/growth.js';
import { findBaselineEntry, loadBundleHistory } from '../history/load.js';
import { resolveBundleHistoryPath } from '../history/paths.js';
import { printBundleComparison } from '../history/print-diff.js';
import { saveBundleHistory, upsertHistoryEntry } from '../history/save.js';
import { loadBudgetsFile } from '../config/load-config.js';
import { collectBundleSnapshot } from '../snapshot/collect-snapshot.js';
import type { BundleHistoryEntry, SizeLimitBudget } from '../snapshot/types.js';

export interface TrackOptions {
    failOnGrowth?: boolean;
    baselineSha?: string;
}

export function buildSyncLimitsHint(
    budgets: SizeLimitBudget[],
    staticGroupLimits: Record<string, { limit: string; label?: string }>,
    hintCommand: string,
): string | null {
    const lowerable = computeStaticLimitUpdates(budgets, staticGroupLimits);
    if (lowerable.length === 0) {
        return null;
    }

    return `Run \`${hintCommand}\` to review lowering ${lowerable.length} static cap(s).`;
}

export function runTrack(config: ResolvedBundleBudgetConfig, options: TrackOptions = {}): void {
    const snapshot = collectBundleSnapshot(config.appRoot, config.distDir);

    if (snapshot.routes.length === 0) {
        cliLogger.warn('Route First Load JS metrics unavailable; budget layer is still recorded.');
    }

    const historyPath = resolveBundleHistoryPath(config.historyDir);
    const history = loadBundleHistory(historyPath);
    const baseline = findBaselineEntry(history, snapshot.commitSha, options.baselineSha);
    const comparison = computeBundleComparison(baseline, snapshot);

    printBundleComparison(comparison, snapshot.commitSha);

    try {
        const entry: BundleHistoryEntry = {
            ...snapshot,
            comparison,
        };
        saveBundleHistory(historyPath, config.historyDir, upsertHistoryEntry(history, entry));
        cliLogger.info('');
        cliLogger.info(`Snapshot saved to ${historyPath}`);
        const budgetsFile = loadBudgetsFile(config.budgetsFile);
        const hint = buildSyncLimitsHint(snapshot.budgets, budgetsFile.groups, config.hintCommand);
        if (hint) {
            cliLogger.info(hint);
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        cliLogger.warn(`Bundle history was not saved: ${message}`);
    }

    if (options.failOnGrowth && hasBundleGrowth(comparison)) {
        process.exitCode = 1;
    }
}
