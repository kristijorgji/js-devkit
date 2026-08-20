import type {
    BudgetDeltaRow,
    BundleComparison,
    BundleHistoryEntry,
    BundleSnapshot,
    RouteDeltaRow,
} from '../snapshot/types.js';

const ROUTE_MOVER_THRESHOLD_BYTES = 1024;
const MAX_ROUTE_MOVERS = 15;

export function computeBudgetDeltas(baseline: BundleSnapshot | null, current: BundleSnapshot): BudgetDeltaRow[] {
    const baselineByName = new Map(baseline?.budgets.map((budget) => [budget.name, budget]) ?? []);

    return current.budgets.map((budget) => {
        const previous = baselineByName.get(budget.name);
        return {
            name: budget.name,
            baselineBytes: previous?.sizeBytes ?? null,
            currentBytes: budget.sizeBytes,
            deltaBytes: previous === undefined ? null : budget.sizeBytes - previous.sizeBytes,
            limitBytes: budget.limitBytes,
        };
    });
}

export function computeRouteMovers(baseline: BundleSnapshot | null, current: BundleSnapshot): RouteDeltaRow[] {
    const baselineByRoute = new Map(baseline?.routes.map((route) => [route.route, route]) ?? []);
    const currentByRoute = new Map(current.routes.map((route) => [route.route, route]));
    const allRoutes = [...new Set([...baselineByRoute.keys(), ...currentByRoute.keys()])].sort();
    const movers: RouteDeltaRow[] = [];

    for (const route of allRoutes) {
        const previous = baselineByRoute.get(route);
        const next = currentByRoute.get(route);

        if (previous && next) {
            const deltaBytes = next.firstLoadUncompressedJsBytes - previous.firstLoadUncompressedJsBytes;
            if (Math.abs(deltaBytes) < ROUTE_MOVER_THRESHOLD_BYTES) {
                continue;
            }
            movers.push({
                route,
                baselineBytes: previous.firstLoadUncompressedJsBytes,
                currentBytes: next.firstLoadUncompressedJsBytes,
                deltaBytes,
                status: 'changed',
            });
            continue;
        }

        if (!previous && next) {
            movers.push({
                route,
                baselineBytes: null,
                currentBytes: next.firstLoadUncompressedJsBytes,
                deltaBytes: next.firstLoadUncompressedJsBytes,
                status: 'new',
            });
            continue;
        }

        if (previous && !next) {
            movers.push({
                route,
                baselineBytes: previous.firstLoadUncompressedJsBytes,
                currentBytes: null,
                deltaBytes: -previous.firstLoadUncompressedJsBytes,
                status: 'removed',
            });
        }
    }

    return movers
        .sort(
            (left, right) =>
                Math.abs(right.deltaBytes ?? 0) - Math.abs(left.deltaBytes ?? 0) ||
                left.route.localeCompare(right.route),
        )
        .slice(0, MAX_ROUTE_MOVERS);
}

export function computeBundleComparison(
    baseline: BundleHistoryEntry | null,
    current: BundleSnapshot,
): BundleComparison {
    return {
        baselineCommitSha: baseline?.commitSha ?? null,
        baselineCommitMessage: baseline?.commitMessage ?? null,
        budgetDeltas: computeBudgetDeltas(baseline, current),
        routeMovers: computeRouteMovers(baseline, current),
    };
}
