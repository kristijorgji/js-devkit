export interface SizeLimitBudget {
    name: string;
    sizeBytes: number;
    limitBytes: number;
    passed: boolean;
}

export interface AppRouteFirstLoad {
    route: string;
    firstLoadUncompressedJsBytes: number;
    firstLoadChunkPaths: string[];
}

export interface BundleSnapshot {
    commitSha: string;
    author: string;
    commitMessage: string;
    branch: string;
    timestamp: string;
    budgets: SizeLimitBudget[];
    routes: AppRouteFirstLoad[];
}

export interface BudgetDeltaRow {
    name: string;
    baselineBytes: number | null;
    currentBytes: number;
    deltaBytes: number | null;
    limitBytes: number;
}

export interface RouteDeltaRow {
    route: string;
    baselineBytes: number | null;
    currentBytes: number | null;
    deltaBytes: number | null;
    status: 'changed' | 'new' | 'removed';
}

export interface BundleComparison {
    baselineCommitSha: string | null;
    baselineCommitMessage: string | null;
    budgetDeltas: BudgetDeltaRow[];
    routeMovers: RouteDeltaRow[];
}

export type BundleHistoryEntry = BundleSnapshot & {
    comparison: BundleComparison | null;
};
