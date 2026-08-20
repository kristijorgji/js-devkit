import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

import type { SizeLimitBudget } from './types.js';

export const SIZE_LIMIT_BUDGETS_JSON_ENV = 'SIZE_LIMIT_BUDGETS_JSON';

export interface SizeLimitJsonRow {
    name: string;
    passed: boolean;
    size: number;
    sizeLimit: number;
}

export function parseSizeLimitJsonRows(stdout: string): SizeLimitJsonRow[] {
    const start = stdout.indexOf('[');
    const end = stdout.lastIndexOf(']');
    if (start === -1 || end === -1) {
        throw new Error(stdout.trim() || 'size-limit --json produced no JSON array');
    }
    return JSON.parse(stdout.slice(start, end + 1)) as SizeLimitJsonRow[];
}

function sizeLimitRowsToBudgets(rows: SizeLimitJsonRow[]): SizeLimitBudget[] {
    return rows.map((row) => ({
        name: row.name,
        sizeBytes: row.size,
        limitBytes: row.sizeLimit,
        passed: row.passed,
    }));
}

export function assertSizeLimitRowsMeasured(rows: SizeLimitJsonRow[]): void {
    const empty = rows.filter((row) => row.size === 0).map((row) => row.name);
    if (empty.length > 0) {
        throw new Error(`Size-limit budgets measured 0 bytes: ${empty.join(', ')}`);
    }
}

export interface CollectSizeLimitBudgetsOptions {
    command?: string;
    args?: string[];
}

export function collectSizeLimitBudgets(
    appRoot: string,
    options: CollectSizeLimitBudgetsOptions = {},
): SizeLimitBudget[] {
    const jsonPath = process.env[SIZE_LIMIT_BUDGETS_JSON_ENV];
    if (jsonPath) {
        const rows = JSON.parse(readFileSync(jsonPath, 'utf8')) as SizeLimitJsonRow[];
        return sizeLimitRowsToBudgets(rows);
    }

    const command = options.command ?? 'pnpm';
    const args = options.args ?? ['exec', 'size-limit', '--json'];
    const result = spawnSync(command, args, {
        cwd: appRoot,
        encoding: 'utf8',
        env: process.env,
    });

    if (result.status !== 0 && !result.stdout?.includes('[')) {
        throw new Error(result.stderr?.trim() || result.stdout?.trim() || 'size-limit --json failed');
    }

    const rows = parseSizeLimitJsonRows(result.stdout ?? '');
    assertSizeLimitRowsMeasured(rows);
    return sizeLimitRowsToBudgets(rows);
}
