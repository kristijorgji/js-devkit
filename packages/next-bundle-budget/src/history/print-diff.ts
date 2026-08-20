import { cliLogger, cliTable } from '@kristijorgji/cli-kit';

import { formatKilobytes, formatSignedKilobytes } from '../snapshot/format-bytes.js';
import type { BundleComparison } from '../snapshot/types.js';

function formatNullableKilobytes(bytes: number | null): string {
    return bytes === null ? '-' : formatKilobytes(bytes);
}

function formatPercentOfLimit(currentBytes: number, limitBytes: number): string {
    return `${((currentBytes / limitBytes) * 100).toFixed(1)}%`;
}

export function printBundleComparison(comparison: BundleComparison, currentCommitSha: string): void {
    const baselineLabel = comparison.baselineCommitSha ? comparison.baselineCommitSha.slice(0, 7) : 'none';
    const currentLabel = currentCommitSha.slice(0, 7);

    cliLogger.info('');
    cliLogger.info(`Bundle budgets vs last snapshot (${baselineLabel} -> ${currentLabel})`);
    if (comparison.baselineCommitMessage) {
        cliLogger.info(`Baseline commit message: "${comparison.baselineCommitMessage}"`);
    }

    cliTable(
        comparison.budgetDeltas.map((row) => ({
            Budget: row.name,
            Baseline: formatNullableKilobytes(row.baselineBytes),
            Current: formatKilobytes(row.currentBytes),
            Delta: row.deltaBytes === null ? '-' : formatSignedKilobytes(row.deltaBytes),
            Limit: formatKilobytes(row.limitBytes),
            '% of limit': formatPercentOfLimit(row.currentBytes, row.limitBytes),
        })),
    );

    if (comparison.routeMovers.length === 0) {
        cliLogger.info('No route movers above 1 KB since the previous snapshot.');
        return;
    }

    cliLogger.info('Top route movers (First Load JS, uncompressed)');
    cliTable(
        comparison.routeMovers.map((row) => ({
            Route: row.route,
            Baseline: formatNullableKilobytes(row.baselineBytes),
            Current: formatNullableKilobytes(row.currentBytes),
            Delta:
                row.deltaBytes === null
                    ? '-'
                    : row.status === 'new'
                      ? `${formatSignedKilobytes(row.deltaBytes)} (new route)`
                      : row.status === 'removed'
                        ? `${formatSignedKilobytes(row.deltaBytes)} (removed)`
                        : formatSignedKilobytes(row.deltaBytes),
        })),
    );
}
