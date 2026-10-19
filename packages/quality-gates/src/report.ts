import type { GateResult } from './runner.js';

const FAILURE_TAIL_LINES = 60;

const STATUS_LABEL: Record<GateResult['status'], string> = {
    passed: 'PASS',
    failed: 'FAIL',
    skipped: 'SKIP',
};

export interface RerunOptions {
    workingTreeScript: string;
    filesScope: boolean;
}

export interface FailureReportOptions {
    workingTreeScript: string;
    packageRoots: readonly string[];
    filesScopedIds: ReadonlySet<string>;
}

function formatDuration(ms: number): string {
    return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
}

export function formatSummary(results: readonly GateResult[]): string {
    const rows = results.map((result) => [
        result.id,
        STATUS_LABEL[result.status],
        result.status === 'skipped' ? '-' : formatDuration(result.durationMs),
        result.status === 'skipped' ? (result.skipReason ?? '') : (result.logPath ?? ''),
    ]);
    const header: string[] = ['gate', 'status', 'time', 'log / reason'];
    const widths = header.map((title, column) =>
        Math.max(title.length, ...rows.map((row) => (row[column] ?? '').length)),
    );
    const line = (cells: readonly string[]): string =>
        cells
            .map((cell, column) => cell.padEnd(widths[column] ?? 0))
            .join('  ')
            .trimEnd();
    return [
        '',
        'Quality gates summary',
        line(header),
        line(widths.map((width) => '-'.repeat(width))),
        ...rows.map(line),
    ]
        .join('\n')
        .concat('\n');
}

function escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Package-relative form of a repo-relative path (`apps/web/src/a.ts` → `src/a.ts`), as printed by tsc under turbo. */
function packageRelative(file: string, packageRoots: readonly string[]): string | undefined {
    const roots = packageRoots.map((root) => root.replace(/\/+$/, '')).filter((root) => root.length > 0);
    if (roots.length === 0) return undefined;
    const match = new RegExp(`^(?:${roots.map(escapeRegExp).join('|')})/[^/]+/(.+)$`).exec(file);
    return match?.[1];
}

/** Exact repo-relative matches win; package-relative matches are only a fallback (tsc output under turbo). */
function filesMentioned(line: string, changedFiles: readonly string[], packageRoots: readonly string[]): string[] {
    const exact = changedFiles.filter((file) => line.includes(file));
    if (exact.length > 0) return exact;
    return changedFiles.filter((file) => {
        const relative = packageRelative(file, packageRoots);
        return relative !== undefined && line.includes(relative);
    });
}

/**
 * Changed files mentioned in a gate's output (repo-relative or package-relative path match). Lines naming several
 * changed files are ignored: they are command echoes (e.g. lint-staged printing `eslint --fix a.ts b.ts`), not errors.
 */
export function citedFiles(
    output: string,
    changedFiles: readonly string[],
    packageRoots: readonly string[] = ['apps', 'packages'],
): string[] {
    const cited = new Set<string>();
    for (const line of output.split('\n')) {
        const hits = filesMentioned(line, changedFiles, packageRoots);
        if (hits.length === 1 && hits[0] !== undefined) cited.add(hits[0]);
    }
    return changedFiles.filter((file) => cited.has(file));
}

export function rerunCommand(id: string, cited: readonly string[], options: RerunOptions): string {
    if (options.filesScope && cited.length > 0) {
        return `${options.workingTreeScript} --files ${cited.join(' ')}`;
    }
    return `${options.workingTreeScript} --gates ${id}`;
}

function tail(output: string, lines: number): string {
    const all = output.trimEnd().split('\n');
    return all.slice(-lines).join('\n');
}

export function formatFailures(
    results: readonly GateResult[],
    changedFiles: readonly string[],
    options: FailureReportOptions,
): string {
    return results
        .filter((result) => result.status === 'failed')
        .map((result) => {
            const cited = citedFiles(result.output, changedFiles, options.packageRoots);
            return [
                '',
                `✖ ${result.id} failed (exit ${result.exitCode ?? 'signal'})`,
                `  log: ${result.logPath ?? '-'}`,
                `  cited files: ${cited.length > 0 ? cited.join(' ') : '(none matched the change set; read the log)'}`,
                `  rerun: ${rerunCommand(result.id, cited, {
                    workingTreeScript: options.workingTreeScript,
                    filesScope: options.filesScopedIds.has(result.id),
                })}`,
                `  --- last ${FAILURE_TAIL_LINES} lines ---`,
                tail(result.output, FAILURE_TAIL_LINES),
            ].join('\n');
        })
        .join('\n')
        .concat('\n');
}

/** Paths whose working-tree content changed between snapshots; a path absent from `before` was unchanged vs HEAD. */
export function changedDuringRun(
    before: ReadonlyMap<string, string | null>,
    after: ReadonlyMap<string, string | null>,
): string[] {
    return [...after.entries()]
        .filter(([file, hash]) => !before.has(file) || before.get(file) !== hash)
        .map(([file]) => file)
        .sort();
}

export function formatFixerChanges(files: readonly string[]): string {
    if (files.length === 0) return '';
    return [
        '',
        'Auto-fixed by gates (unstaged; review with `git diff`):',
        ...files.map((file) => `  ${file}`),
        '',
    ].join('\n');
}

export function formatIndexGuardFailure(): string {
    return [
        '',
        '✖ Index changed during run. Staged state was NOT preserved.',
        '  Working-tree gates must never modify the git index. Inspect with `git diff --cached`.',
        '  (Staging files yourself while the gates run also triggers this check.)',
        '',
    ].join('\n');
}
