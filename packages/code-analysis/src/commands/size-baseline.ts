import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { readSizeLimitsBaseline } from '@kristijorgji/eslint-plugin';

import { collectSizeViolations } from '../analyzers/size-baseline/collect-size-violations.js';
import { mergeSizeBaseline, type SizeBaselineChange } from '../analyzers/size-baseline/merge-size-baseline.js';
import { resolveSizeBaselineConfig } from '../lib/config.js';
import { logger } from '../lib/logger.js';

export interface SizeBaselineFlags {
    root?: string;
    packages?: string[];
    check: boolean;
    allowNew: boolean;
}

function formatChanges(label: string, changes: SizeBaselineChange[]): string {
    if (changes.length === 0) return '';
    const lines = changes.map((change) => {
        const from = change.from === undefined ? '-' : String(change.from);
        const to = change.to === undefined ? '-' : String(change.to);
        return `  ${change.file} ${change.rule}: ${from} -> ${to}`;
    });
    return `${label}:\n${lines.join('\n')}`;
}

function logMerge(dir: string, merge: ReturnType<typeof mergeSizeBaseline>): void {
    const blocks = [
        formatChanges('added', merge.added),
        formatChanges('increased', merge.increased),
        formatChanges('decreased', merge.decreased),
        formatChanges('removed', merge.removed),
    ].filter((block) => block.length > 0);
    if (blocks.length === 0) return;
    logger.info(`${dir}\n${blocks.join('\n')}`);
}

const INNER_ENV = 'KJ_SIZE_BASELINE_INNER';

function runPackagesInChildProcesses(flags: SizeBaselineFlags, dirs: string[]): void {
    const cli = fileURLToPath(new URL('../cli.js', import.meta.url));
    for (const dir of dirs) {
        const args = [cli, 'size-baseline', '--package', dir];
        if (flags.check) args.push('--check');
        if (flags.allowNew) args.push('--allow-new');
        if (flags.root) args.push('--root', flags.root);
        const result = spawnSync(process.execPath, args, {
            stdio: 'inherit',
            env: { ...process.env, [INNER_ENV]: '1' },
        });
        if (result.status && result.status !== 0) {
            process.exitCode = result.status;
        }
        if (result.error) {
            throw result.error;
        }
    }
}

export async function runSizeBaselineCommand(flags: SizeBaselineFlags): Promise<void> {
    const config = resolveSizeBaselineConfig({ cwd: process.cwd(), flags });
    if (config.packages.length > 1 && process.env[INNER_ENV] !== '1') {
        runPackagesInChildProcesses(
            flags,
            config.packages.map((pkg) => pkg.dir)
        );
        return;
    }

    for (const pkg of config.packages) {
        const packageDir = path.resolve(config.repoRoot, pkg.dir);
        const baselinePath = path.join(packageDir, config.baselineFile);
        const current = await collectSizeViolations({
            repoRoot: config.repoRoot,
            packageDir,
            lintPaths: pkg.lintPaths,
        });
        const existing = readSizeLimitsBaseline(baselinePath);
        const merge = mergeSizeBaseline(existing, current);
        const hasAnyChange =
            merge.added.length > 0 ||
            merge.increased.length > 0 ||
            merge.decreased.length > 0 ||
            merge.removed.length > 0;

        if (flags.check) {
            if (hasAnyChange) {
                logMerge(pkg.dir, merge);
                logger.error(`size-limits baseline stale for ${pkg.dir}: run kj-analyze size-baseline`);
                process.exitCode = 1;
            }
            continue;
        }

        if ((merge.added.length > 0 || merge.increased.length > 0) && !flags.allowNew) {
            logMerge(pkg.dir, merge);
            logger.error(
                'new oversized code: refactor it instead of adding it to the baseline (use --allow-new only for initial adoption)'
            );
            process.exitCode = 1;
            continue;
        }

        if (Object.keys(merge.next).length === 0) {
            if (fs.existsSync(baselinePath)) {
                fs.unlinkSync(baselinePath);
            }
            continue;
        }

        fs.writeFileSync(baselinePath, `${JSON.stringify(merge.next, null, config.jsonIndent)}\n`);
        logger.info(`wrote ${path.relative(config.repoRoot, baselinePath)}`);
    }
}
