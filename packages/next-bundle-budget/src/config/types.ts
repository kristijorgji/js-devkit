import type { AdapterId } from '../adapters/types.js';

export interface ExtraChunkGroup {
    id: string;
    label: string;
    paths: string[];
}

export interface BundleBudgetConfig {
    /** absolute path to the Next app root (where .next lives) */
    appRoot: string;
    /** default '.next' */
    distDir?: string;
    /** default: auto-detect via adapters/detect.ts */
    adapter?: 'auto' | AdapterId;
    /** default '<appRoot>/docs/generated/bundle-size' */
    historyDir?: string;
    /** default '<appRoot>/bundle-budgets.json' */
    budgetsFile?: string;
    /** extra non-Next artifacts to budget, e.g. the service worker */
    extraGroups?: ExtraChunkGroup[];
    /** manifest key -> logical route name. Default: normalizeAppPath. Return null to skip. */
    resolveRouteName?: (manifestKey: string) => string | null;
    /** throw when a route in bundle-budgets.json has no measured chunks. Default true. */
    strictRoutes?: boolean;
    /** command used to produce a production build. Default ['pnpm','exec','next','build'] */
    buildCommand?: string[];
    /** commands run before measuring, e.g. building a service worker */
    prebuildCommands?: string[][];
    /** printed after track when static caps can be lowered */
    hintCommand?: string;
}

export interface BudgetEntry {
    limit: string;
    measuredAt?: string;
    note?: string;
}

export interface BundleBudgetsFile {
    groups: Record<string, BudgetEntry>;
    routes: Record<string, BudgetEntry>;
}

export interface ResolvedBundleBudgetConfig {
    appRoot: string;
    distDir: string;
    adapter: 'auto' | AdapterId;
    historyDir: string;
    budgetsFile: string;
    extraGroups: ExtraChunkGroup[];
    resolveRouteName: (manifestKey: string) => string | null;
    strictRoutes: boolean;
    buildCommand: string[];
    prebuildCommands: string[][];
    hintCommand: string;
}
