import { existsSync } from 'node:fs';

import { cliLogger } from '@kristijorgji/cli-kit';

import { detectAdapter } from '../adapters/detect.js';
import { escapeSizeLimitGlobPath } from './limit-format.js';
import { loadBudgetsFile } from '../config/load-config.js';
import type { BundleBudgetConfig } from '../config/types.js';
import { resolveBundleBudgetConfig } from '../config/load-config.js';

import { lookupGroupLimit, routeOwnedBudgetName, type SizeLimitEntry } from './chunk-groups.js';
import { validateSizeLimitEntries } from './validate-entries.js';

export function buildSizeLimitEntries(config: BundleBudgetConfig): SizeLimitEntry[] {
    const resolved = resolveBundleBudgetConfig(config);

    const distDir = resolved.distDir;
    if (!existsSync(distDir)) {
        throw new Error(`Missing Next production build in ${distDir}. Run a production build first.`);
    }

    const adapter = detectAdapter(distDir, resolved.adapter);
    const budgets = loadBudgetsFile(resolved.budgetsFile);
    const extraGroups = resolved.extraGroups;
    const groups = [...extraGroups, ...adapter.listChunkGroups(distDir)];

    const missingGroupIds: string[] = [];
    const entries: SizeLimitEntry[] = [];

    for (const group of groups) {
        const limit = lookupGroupLimit(budgets.groups, group.id);
        if (!limit) {
            missingGroupIds.push(group.id);
            continue;
        }
        entries.push({
            name: group.label,
            path: group.paths.length === 1 ? (group.paths[0] ?? group.paths) : group.paths,
            limit,
        });
    }

    if (missingGroupIds.length > 0) {
        throw new Error(`Missing limits in ${resolved.budgetsFile} for groups: ${missingGroupIds.join(', ')}`);
    }

    if (!adapter.capabilities.perRouteChunks) {
        cliLogger.warn(`Adapter ${adapter.id} cannot measure per-route chunks; skipping route-owned budgets.`);
    } else {
        const pages = adapter.listPageOwnedChunks(distDir);
        const collected = new Set<string>();

        for (const page of pages) {
            const routeName = resolved.resolveRouteName(page.manifestKey);
            if (!routeName) {
                continue;
            }
            collected.add(routeName);
            const routeBudget = budgets.routes[routeName];
            if (!routeBudget) {
                if (resolved.strictRoutes) {
                    throw new Error(`Missing route budget for ${routeName} in ${resolved.budgetsFile}`);
                }
                continue;
            }
            entries.push({
                name: routeOwnedBudgetName(routeName),
                path: page.chunkPaths.map((chunkPath) => escapeSizeLimitGlobPath(`.next/${chunkPath}`)),
                limit: routeBudget.limit,
            });
        }

        const missingRoutes = Object.keys(budgets.routes).filter((name) => !collected.has(name));
        if (missingRoutes.length > 0 && resolved.strictRoutes) {
            throw new Error(`Missing page-owned chunks for routes: ${missingRoutes.join(', ')}`);
        }
    }

    validateSizeLimitEntries(entries, resolved.appRoot);
    return entries;
}
