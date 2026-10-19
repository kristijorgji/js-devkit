import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import type { GateMode } from './types.js';

interface GitOptions {
    cwd: string;
    env?: Record<string, string>;
    input?: string;
}

function git(args: readonly string[], { cwd, env, input }: GitOptions): string {
    return execFileSync('git', args, {
        cwd,
        env: { ...process.env, ...env },
        input,
        encoding: 'utf8',
        maxBuffer: 256 * 1024 * 1024,
        stdio: ['pipe', 'pipe', 'pipe'],
    });
}

function splitNul(output: string): string[] {
    return output.split('\0').filter((entry) => entry.length > 0);
}

function sha256(data: string | Buffer): string {
    return createHash('sha256').update(data).digest('hex');
}

export function getRepoRoot(cwd: string): string {
    return git(['rev-parse', '--show-toplevel'], { cwd }).trim();
}

export function hasHeadCommit(cwd: string): boolean {
    try {
        git(['rev-parse', '--verify', '--quiet', 'HEAD'], { cwd });
        return true;
    } catch {
        return false;
    }
}

export function getUntrackedFiles(cwd: string): string[] {
    return splitNul(git(['ls-files', '--others', '--exclude-standard', '-z'], { cwd }));
}

/** Staged files (pre-commit) or tracked changes vs HEAD plus untracked files (working-tree), sorted. */
export function getChangedFiles(mode: GateMode, cwd: string): string[] {
    if (mode === 'pre-commit') {
        return splitNul(git(['diff', '--cached', '--name-only', '--diff-filter=ACMR', '-z'], { cwd })).sort();
    }
    const tracked = hasHeadCommit(cwd)
        ? git(['diff', 'HEAD', '--name-only', '--diff-filter=ACMR', '-z'], { cwd })
        : git(['ls-files', '-z'], { cwd });
    return [...new Set([...splitNul(tracked), ...getUntrackedFiles(cwd)])].sort();
}

/** Content fingerprint of the real index (mode, blob sha, stage, path per entry); ignores stat-cache refreshes. */
export function snapshotIndex(cwd: string): string {
    return sha256(git(['ls-files', '--stage', '-z'], { cwd }));
}

/** Working-tree content hash per repo-relative path; `null` for missing or unreadable paths. */
export function hashWorkingFiles(files: readonly string[], cwd: string): Map<string, string | null> {
    const hashes = new Map<string, string | null>();
    for (const file of files) {
        try {
            hashes.set(file, sha256(fs.readFileSync(path.join(cwd, file))));
        } catch {
            hashes.set(file, null);
        }
    }
    return hashes;
}

export interface IsolatedIndex {
    env: { GIT_INDEX_FILE: string };
    /** Ref or tree for `git diff <diffBase>` that lists exactly the files in scope (`HEAD` when unscoped). */
    diffBase: string;
}

function pathspecInput(files: readonly string[]): string {
    return `${files.join('\0')}\0`;
}

const PATHSPEC_STDIN: readonly string[] = ['--pathspec-from-file=-', '--pathspec-file-nul'];

/**
 * Tree equal to the working tree except that `files` are at their HEAD state (absent when new), so
 * `git diff <tree>` reports only `files`. Mutates the temporary index only.
 */
function scopedDiffBase(files: readonly string[], options: GitOptions & { hasHead: boolean }): string {
    const { cwd, env } = options;
    git(['add', '-A'], { cwd, env });
    if (options.hasHead) {
        git(['reset', '-q', 'HEAD', ...PATHSPEC_STDIN], { cwd, env, input: pathspecInput(files) });
    } else {
        git(['rm', '-q', '--cached', '--ignore-unmatch', ...PATHSPEC_STDIN], { cwd, env, input: pathspecInput(files) });
    }
    const tree = git(['write-tree'], { cwd, env }).trim();
    const existing = files.filter((file) => fs.existsSync(path.join(cwd, file)));
    if (existing.length > 0) {
        git(['add', '--intent-to-add', ...PATHSPEC_STDIN], { cwd, env, input: pathspecInput(existing) });
    }
    return tree;
}

/**
 * Runs `fn` against a temporary copy of the git index (untracked files marked intent-to-add so they show up in
 * `git diff`). Any `git add` performed by `fn` or its subprocesses only touches the copy. With `scopeFiles`, the
 * returned `diffBase` limits `git diff <diffBase>` to those files.
 */
export async function withIsolatedIndex<T>(
    cwd: string,
    scopeFiles: readonly string[] | undefined,
    fn: (isolated: IsolatedIndex) => Promise<T>,
): Promise<T> {
    const indexPath = git(['rev-parse', '--path-format=absolute', '--git-path', 'index'], { cwd }).trim();
    const tempIndex = path.join(path.dirname(indexPath), `quality-gates-${process.pid}.index`);
    const env: IsolatedIndex['env'] = { GIT_INDEX_FILE: tempIndex };
    try {
        if (fs.existsSync(indexPath)) {
            fs.copyFileSync(indexPath, tempIndex);
        }
        const untracked = getUntrackedFiles(cwd);
        if (untracked.length > 0) {
            git(['add', '--intent-to-add', ...PATHSPEC_STDIN], { cwd, env, input: pathspecInput(untracked) });
        }
        const diffBase =
            scopeFiles && scopeFiles.length > 0
                ? scopedDiffBase(scopeFiles, { cwd, env, hasHead: hasHeadCommit(cwd) })
                : 'HEAD';
        return await fn({ env, diffBase });
    } finally {
        fs.rmSync(tempIndex, { force: true });
        fs.rmSync(`${tempIndex}.lock`, { force: true });
    }
}
