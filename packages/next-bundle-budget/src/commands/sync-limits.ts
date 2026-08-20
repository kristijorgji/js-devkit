import { writeFileSync } from 'node:fs';

import { cliLogger, cliTable } from '@kristijorgji/cli-kit';

import { loadBudgetsFile } from '../config/load-config.js';
import type { BundleBudgetsFile, ResolvedBundleBudgetConfig } from '../config/types.js';
import { parseRouteOwnedBudgetName } from '../size-limit/chunk-groups.js';
import {
    parseSizeLimitToBytes,
    suggestedLimitFromMeasuredSize,
    suggestedRouteOwnedLimitFromMeasuredSize,
} from '../size-limit/limit-format.js';
import { collectSizeLimitBudgets } from '../snapshot/collect-size-limit-budgets.js';
import type { SizeLimitBudget } from '../snapshot/types.js';

export interface StaticLimitUpdate {
    name: string;
    groupId: string;
    currentLimit: string;
    suggestedLimit: string;
    sizeBytes: number;
}

export interface RouteLimitUpdate {
    routeName: string;
    currentLimit: string;
    suggestedLimit: string;
    sizeBytes: number;
}

export function computeStaticLimitUpdates(
    measuredBudgets: SizeLimitBudget[],
    groupLimits: Record<string, { limit: string }>,
): StaticLimitUpdate[] {
    const measuredByName = new Map(measuredBudgets.map((budget) => [budget.name, budget]));
    const updates: StaticLimitUpdate[] = [];

    for (const [groupId, entry] of Object.entries(groupLimits)) {
        const measured = measuredByName.get(labelForGroup(groupId, measuredBudgets) ?? '') ?? findByGroupHeuristic(measuredBudgets, groupId);
        if (!measured) {
            continue;
        }

        const suggestedLimit = suggestedLimitFromMeasuredSize(measured.sizeBytes);
        const suggestedBytes = parseSizeLimitToBytes(suggestedLimit);
        const currentBytes = parseSizeLimitToBytes(entry.limit);

        if (suggestedBytes < currentBytes) {
            updates.push({
                name: measured.name,
                groupId,
                currentLimit: entry.limit,
                suggestedLimit,
                sizeBytes: measured.sizeBytes,
            });
        }
    }

    return updates;
}

function labelForGroup(groupId: string, measured: SizeLimitBudget[]): string | null {
    const labels: Record<string, string> = {
        serviceWorker: 'Service worker',
        framework: 'Next framework',
        main: 'Next main',
        polyfills: 'Next polyfills',
        webpackRuntime: 'Next webpack runtime',
        runtime: 'Next turbopack runtime',
        asyncChunks: 'Next async chunks (total)',
        appRouteChunks: 'Next app route chunks (total)',
        middleware: 'Edge middleware',
        sharedVendorTotal: 'Next shared chunks (total)',
        sharedVendor: 'Next shared chunk #1',
    };
    if (labels[groupId]) {
        return labels[groupId];
    }
    const ranked = groupId.match(/^sharedVendor(\d+)$/);
    if (ranked) {
        return `Next shared chunk #${ranked[1]}`;
    }
    return measured.find((row) => row.name === groupId)?.name ?? null;
}

function findByGroupHeuristic(measured: SizeLimitBudget[], groupId: string): SizeLimitBudget | undefined {
    const label = labelForGroup(groupId, measured);
    return label ? measured.find((row) => row.name === label) : undefined;
}

export function computeRouteLimitUpdates(
    measuredBudgets: SizeLimitBudget[],
    routeLimits: Record<string, { limit: string }>,
    options: { init: boolean } = { init: false },
): RouteLimitUpdate[] {
    const updates: RouteLimitUpdate[] = [];

    for (const budget of measuredBudgets) {
        const routeName = parseRouteOwnedBudgetName(budget.name);
        if (!routeName) {
            continue;
        }

        const suggestedLimit = suggestedRouteOwnedLimitFromMeasuredSize(budget.sizeBytes);
        const currentLimit = routeLimits[routeName]?.limit;
        if (!currentLimit && !options.init) {
            continue;
        }

        const suggestedBytes = parseSizeLimitToBytes(suggestedLimit);
        const currentBytes = currentLimit ? parseSizeLimitToBytes(currentLimit) : Number.POSITIVE_INFINITY;

        if (suggestedLimit === currentLimit) {
            continue;
        }
        if (options.init || suggestedBytes < currentBytes) {
            updates.push({
                routeName,
                currentLimit: currentLimit ?? '(none)',
                suggestedLimit,
                sizeBytes: budget.sizeBytes,
            });
        }
    }

    return updates;
}

export function applyBudgetUpdates(
    file: BundleBudgetsFile,
    staticUpdates: StaticLimitUpdate[],
    routeUpdates: RouteLimitUpdate[],
): BundleBudgetsFile {
    const next: BundleBudgetsFile = {
        groups: { ...file.groups },
        routes: { ...file.routes },
    };
    const measuredAt = new Date().toISOString().slice(0, 10);

    for (const update of staticUpdates) {
        const existing = next.groups[update.groupId] ?? { limit: update.currentLimit };
        next.groups[update.groupId] = { ...existing, limit: update.suggestedLimit, measuredAt };
    }
    for (const update of routeUpdates) {
        const existing = next.routes[update.routeName] ?? { limit: update.currentLimit };
        next.routes[update.routeName] = { ...existing, limit: update.suggestedLimit, measuredAt };
    }
    return next;
}

export function runSyncLimits(
    config: ResolvedBundleBudgetConfig,
    options: { apply: boolean; initRoutes: boolean },
): void {
    const measured = collectSizeLimitBudgets(config.appRoot);
    const file = loadBudgetsFile(config.budgetsFile);
    const staticUpdates = options.initRoutes ? [] : computeStaticLimitUpdates(measured, file.groups);
    const routeUpdates = computeRouteLimitUpdates(measured, file.routes, { init: options.initRoutes });

    if (staticUpdates.length === 0 && routeUpdates.length === 0) {
        cliLogger.info(
            options.initRoutes
                ? 'Route caps already match measured + 15% headroom.'
                : 'No size-limit caps can be lowered with the current build.',
        );
        return;
    }

    if (staticUpdates.length > 0) {
        cliLogger.info('Suggested static cap updates (15% headroom over measured Brotli size):');
        cliTable(
            staticUpdates.map((update) => ({
                Budget: update.name,
                Measured: `${(update.sizeBytes / 1024).toFixed(2)} KB`,
                Current: update.currentLimit,
                Suggested: update.suggestedLimit,
            })),
        );
    }
    if (routeUpdates.length > 0) {
        cliLogger.info(
            options.initRoutes
                ? 'Suggested route-owned caps (15% headroom, +2 KB floor):'
                : 'Suggested route-owned cap lowers (15% headroom, +2 KB floor):',
        );
        cliTable(
            routeUpdates.map((update) => ({
                Route: update.routeName,
                Measured: `${(update.sizeBytes / 1024).toFixed(2)} KB`,
                Current: update.currentLimit,
                Suggested: update.suggestedLimit,
            })),
        );
    }

    if (!options.apply) {
        cliLogger.info(
            options.initRoutes
                ? `Dry run only. Re-run with --init-routes --apply to write ${config.budgetsFile}`
                : `Dry run only. Re-run with --apply to write ${config.budgetsFile}`,
        );
        return;
    }

    const next = applyBudgetUpdates(file, staticUpdates, routeUpdates);
    writeFileSync(config.budgetsFile, `${JSON.stringify(next, null, 2)}\n`, 'utf8');
    cliLogger.info(`Updated ${config.budgetsFile}`);
}
