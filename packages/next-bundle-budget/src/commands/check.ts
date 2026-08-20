import { spawnSync } from 'node:child_process';
import { existsSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { cliLogger, cliTable, runCommand } from '@kristijorgji/cli-kit';

import { detectAdapter } from '../adapters/detect.js';
import { formatSharedVendorRankMap } from '../adapters/vendor-chunks.js';
import type { ResolvedBundleBudgetConfig } from '../config/types.js';
import { buildSizeLimitEntries } from '../size-limit/compose-entries.js';
import {
    assertSizeLimitRowsMeasured,
    parseSizeLimitJsonRows,
    SIZE_LIMIT_BUDGETS_JSON_ENV,
} from '../snapshot/collect-size-limit-budgets.js';

import { runTrack } from './track.js';

export interface CheckOptions {
    skipTrack?: boolean;
    track?: boolean;
}

export function runCheck(config: ResolvedBundleBudgetConfig, options: CheckOptions = {}): void {
    for (const command of config.prebuildCommands) {
        const [bin, ...args] = command;
        if (!bin) {
            continue;
        }
        runCommand(bin, args, { cwd: config.appRoot, env: { NODE_ENV: 'production' } });
    }

    if (!existsSync(join(config.distDir, 'BUILD_ID'))) {
        const [bin, ...args] = config.buildCommand;
        if (!bin) {
            throw new Error('buildCommand must include a binary');
        }
        runCommand(bin, args, { cwd: config.appRoot });
    }

    const adapter = detectAdapter(config.distDir, config.adapter);
    const entries = buildSizeLimitEntries(config);
    cliLogger.info(`${entries.length} size-limit budgets`);
    cliLogger.info(`Shared vendor ranks: ${formatSharedVendorRankMap(adapter.listSharedVendorChunks(config.distDir))}`);

    const result = spawnSync('pnpm', ['exec', 'size-limit', '--json'], {
        cwd: config.appRoot,
        encoding: 'utf8',
        env: process.env,
    });

    let rows;
    try {
        rows = parseSizeLimitJsonRows(result.stdout ?? '');
        assertSizeLimitRowsMeasured(rows);
    } catch (error) {
        const details = result.stderr?.trim() || (error instanceof Error ? error.message : String(error));
        cliLogger.error(details);
        process.exit(result.status ?? 1);
    }

    cliTable(
        rows.map((row) => ({
            Budget: row.name,
            SizeKB: Number((row.size / 1024).toFixed(2)),
            LimitKB: Number((row.sizeLimit / 1024).toFixed(2)),
            Passed: row.passed,
        })),
    );

    const failed = rows.filter((row) => !row.passed);
    if (failed.length > 0 || result.status !== 0) {
        cliLogger.error(`size-limit failed (${failed.length} over budget)`);
        process.exit(result.status ?? 1);
    }

    const shouldTrack =
        options.track === true ||
        (options.skipTrack !== true &&
            process.env.SKIP_BUNDLE_TRACK !== '1' &&
            process.env.TRACK_BUNDLE_HISTORY === '1');

    if (shouldTrack) {
        const jsonPath = join(tmpdir(), `size-limit-budgets-${process.pid}.json`);
        writeFileSync(jsonPath, JSON.stringify(rows), 'utf8');
        const previous = process.env[SIZE_LIMIT_BUDGETS_JSON_ENV];
        process.env[SIZE_LIMIT_BUDGETS_JSON_ENV] = jsonPath;
        try {
            runTrack(config, {});
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            cliLogger.warn(`Bundle history tracking failed; continuing. ${message}`);
        } finally {
            if (previous === undefined) {
                delete process.env[SIZE_LIMIT_BUDGETS_JSON_ENV];
            } else {
                process.env[SIZE_LIMIT_BUDGETS_JSON_ENV] = previous;
            }
        }
    }
}
