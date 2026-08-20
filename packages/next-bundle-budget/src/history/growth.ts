import type { BundleComparison } from '../snapshot/types.js';

export function hasBundleGrowth(comparison: BundleComparison): boolean {
    const budgetGrew = comparison.budgetDeltas.some((row) => row.deltaBytes !== null && row.deltaBytes > 0);
    const routeGrew = comparison.routeMovers.some((row) => row.deltaBytes !== null && row.deltaBytes > 0);

    return budgetGrew || routeGrew;
}
