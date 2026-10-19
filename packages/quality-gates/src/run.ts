/**
 * Quality gate runner shared by Husky pre-commit hooks and agent working-tree checks.
 *
 * Exit codes: 0 all planned gates passed, 1 a gate failed, 2 index guard tripped or usage/internal error.
 */
import fs from 'node:fs';
import path from 'node:path';

import { isHelpOrVersion, parseArgs, peekConfigPath } from './args.js';
import { loadConfig } from './config/load-config.js';
import type { ResolvedQualityGatesConfig } from './config/types.js';
import {
    getChangedFiles,
    getRepoRoot,
    hasHeadCommit,
    hashWorkingFiles,
    snapshotIndex,
    withIsolatedIndex,
} from './git-state.js';
import {
    changedDuringRun,
    formatFailures,
    formatFixerChanges,
    formatIndexGuardFailure,
    formatSummary,
} from './report.js';
import { planGates, runGates, spawnGate } from './runner.js';
import type { GateContext } from './types.js';

export const EXIT_GATE_FAILED = 1;
export const EXIT_USAGE_OR_GUARD = 2;

function toRepoRelative(files: readonly string[], root: string): string[] {
    return files.map((file) => path.relative(root, path.resolve(process.cwd(), file)).split(path.sep).join('/'));
}

function filesScopedIds(config: ResolvedQualityGatesConfig): Set<string> {
    return new Set(config.gates.filter((gate) => gate.scope === 'files').map((gate) => gate.id));
}

export async function runCli(argv: readonly string[] = process.argv.slice(2)): Promise<number> {
    // Smoke-pack and `kj-quality-gates --help` run outside a git repo; do not touch git first.
    if (isHelpOrVersion(argv)) {
        parseArgs(argv, []);
        return 0;
    }

    const root = getRepoRoot(process.cwd());
    const config = await loadConfig(root, { configPath: peekConfigPath(argv) });
    const args = parseArgs(argv, config.gates.map((gate) => gate.id));
    const changedFiles = getChangedFiles(args.mode, root);
    const files = args.files ? toRepoRelative(args.files, root) : undefined;

    const outside = (files ?? []).filter((file) => !changedFiles.includes(file));
    if (outside.length > 0) {
        process.stdout.write(`⚠ Not changed vs HEAD (lint-staged will ignore): ${outside.join(' ')}\n`);
    }

    const ctx: GateContext = {
        mode: args.mode,
        changedFiles,
        files,
        hasHead: hasHeadCommit(root),
        packageManager: config.packageManager,
    };
    const plan = planGates(config.gates, ctx, { gateIds: args.gateIds, filesOnly: files !== undefined });

    const logDir = path.join(root, config.logDir, args.mode);
    fs.rmSync(logDir, { recursive: true, force: true });
    fs.mkdirSync(logDir, { recursive: true });

    const guarded = args.mode === 'working-tree';
    const indexBefore = guarded ? snapshotIndex(root) : '';
    const hashesBefore = guarded ? hashWorkingFiles(changedFiles, root) : new Map<string, string | null>();

    const results = await runGates(
        plan,
        ctx,
        { cwd: root, failFast: args.mode === 'pre-commit', logDir },
        { spawnGate, withIsolatedIndex: (fn) => withIsolatedIndex(root, files, fn) },
    );

    process.stdout.write(formatSummary(results));
    process.stdout.write(
        formatFailures(results, changedFiles, {
            workingTreeScript: config.workingTreeScript,
            packageRoots: config.packageRoots,
            filesScopedIds: filesScopedIds(config),
        }),
    );

    let exitCode = results.some((result) => result.status === 'failed') ? EXIT_GATE_FAILED : 0;
    if (guarded) {
        const changedAfter = getChangedFiles(args.mode, root);
        const filesToHash: string[] = [...new Set([...changedFiles, ...changedAfter])];
        process.stdout.write(formatFixerChanges(changedDuringRun(hashesBefore, hashWorkingFiles(filesToHash, root))));
        if (snapshotIndex(root) !== indexBefore) {
            process.stderr.write(formatIndexGuardFailure());
            exitCode = EXIT_USAGE_OR_GUARD;
        }
    }
    process.stdout.write(exitCode === 0 ? '\n✔ All planned gates passed.\n' : '');
    return exitCode;
}
