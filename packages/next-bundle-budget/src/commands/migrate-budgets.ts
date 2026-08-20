import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { cliLogger } from '@kristijorgji/cli-kit';

import type { BundleBudgetsFile, ResolvedBundleBudgetConfig } from '../config/types.js';

const GROUP_NAME_TO_ID: Record<string, string> = {
    'Service worker': 'serviceWorker',
    'Next framework': 'framework',
    'Next main': 'main',
    'Next polyfills': 'polyfills',
    'Next webpack runtime': 'webpackRuntime',
    'Next async chunks (total)': 'asyncChunks',
    'Next app route chunks (total)': 'appRouteChunks',
    'Edge middleware': 'middleware',
};

function extractNamedLimits(source: string): Array<{ name: string; limit: string }> {
    const rows: Array<{ name: string; limit: string }> = [];
    const nameRe = /name:\s*(?:'([^']+)'|([A-Z_]+))/g;
    let match: RegExpExecArray | null;
    while ((match = nameRe.exec(source)) !== null) {
        const after = source.slice(match.index);
        const limitMatch = after.match(/limit:\s*'([^']+)'/);
        if (!limitMatch?.[1]) {
            continue;
        }
        const name = match[1] ?? (match[2] === 'ASYNC_CHUNKS_BUDGET_NAME' ? 'Next async chunks (total)' : match[2]);
        if (name) {
            rows.push({ name, limit: limitMatch[1] });
        }
    }
    return rows;
}

function extractRouteLimits(source: string): Record<string, string> {
    const routes: Record<string, string> = {};
    const re = /([A-Za-z][A-Za-z0-9]*):\s*'(\d+(?:\.\d+)?\s*(?:B|KB|MB))'/g;
    let match: RegExpExecArray | null;
    while ((match = re.exec(source)) !== null) {
        const key = match[1];
        const limit = match[2];
        if (key && limit && key !== 'limit') {
            routes[key] = limit;
        }
    }
    return routes;
}

function extractVendorLimits(source: string): { perChunk?: string; total?: string } {
    const per = source.match(/SHARED_VENDOR_CHUNK_LIMIT\s*=\s*'([^']+)'/);
    const total = source.match(/SHARED_VENDOR_CHUNKS_TOTAL_LIMIT\s*=\s*'([^']+)'/);
    return { perChunk: per?.[1], total: total?.[1] };
}

export function migrateBudgetsFromLegacyFiles(options: {
    staticBudgetsPath: string;
    routeBudgetsPath: string;
}): BundleBudgetsFile {
    const groups: BundleBudgetsFile['groups'] = {};
    const routes: BundleBudgetsFile['routes'] = {};

    if (existsSync(options.staticBudgetsPath)) {
        const source = readFileSync(options.staticBudgetsPath, 'utf8');
        for (const row of extractNamedLimits(source)) {
            const id = GROUP_NAME_TO_ID[row.name];
            if (id) {
                groups[id] = { limit: row.limit };
            }
        }
        const vendor = extractVendorLimits(source);
        if (vendor.perChunk) {
            groups.sharedVendor = { limit: vendor.perChunk };
        }
        if (vendor.total) {
            groups.sharedVendorTotal = { limit: vendor.total };
        }
    }

    if (existsSync(options.routeBudgetsPath)) {
        const source = readFileSync(options.routeBudgetsPath, 'utf8');
        for (const [routeName, limit] of Object.entries(extractRouteLimits(source))) {
            routes[routeName] = { limit };
        }
    }

    return { groups, routes };
}

export function runMigrateBudgets(config: ResolvedBundleBudgetConfig, outPath?: string): void {
    const scriptsDir = join(config.appRoot, 'scripts/lib/size-limit');
    const file = migrateBudgetsFromLegacyFiles({
        staticBudgetsPath: join(scriptsDir, 'static-budgets.ts'),
        routeBudgetsPath: join(scriptsDir, 'route-budgets.ts'),
    });
    const dest = outPath ?? config.budgetsFile;
    writeFileSync(dest, `${JSON.stringify(file, null, 2)}\n`, 'utf8');
    cliLogger.info(`Wrote ${dest} (${Object.keys(file.groups).length} groups, ${Object.keys(file.routes).length} routes)`);
}
