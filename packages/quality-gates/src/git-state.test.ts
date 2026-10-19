import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { getChangedFiles, snapshotIndex, withIsolatedIndex } from './git-state.js';

const GIT_ENV: Record<string, string> = {
    GIT_AUTHOR_NAME: 'Test',
    GIT_AUTHOR_EMAIL: 'test@example.com',
    GIT_COMMITTER_NAME: 'Test',
    GIT_COMMITTER_EMAIL: 'test@example.com',
};

function git(cwd: string, args: readonly string[], env: Record<string, string> = {}): string {
    return execFileSync('git', ['-c', 'commit.gpgsign=false', '-c', 'core.hooksPath=/dev/null', ...args], {
        cwd,
        env: { ...process.env, ...GIT_ENV, ...env },
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
    });
}

function write(root: string, file: string, content: string): void {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    fs.writeFileSync(path.join(root, file), content);
}

const ORIGINAL = Array.from({ length: 20 }, (_, i) => `line ${i}`)
    .join('\n')
    .concat('\n');

/** Commits `a.txt`, stages an edit at the top, leaves an unstaged edit at the bottom, adds untracked `new.ts`. */
function setupPartiallyStagedRepo(root: string): void {
    git(root, ['init', '-q', '-b', 'main']);
    write(root, 'a.txt', ORIGINAL);
    write(root, 'committed.txt', 'unchanged\n');
    git(root, ['add', '.']);
    git(root, ['commit', '-q', '-m', 'init']);

    write(root, 'a.txt', ORIGINAL.replace('line 0', 'line 0 staged'));
    git(root, ['add', 'a.txt']);
    write(root, 'a.txt', ORIGINAL.replace('line 0', 'line 0 staged').replace('line 19', 'line 19 unstaged'));
    write(root, 'src/new.ts', 'export const x = 1;\n');
}

describe('git-state', () => {
    let root: string;
    const savedIndexEnv = process.env.GIT_INDEX_FILE;

    beforeEach(() => {
        delete process.env.GIT_INDEX_FILE;
        root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'quality-gates-')));
        setupPartiallyStagedRepo(root);
    });

    afterEach(() => {
        fs.rmSync(root, { recursive: true, force: true });
        if (savedIndexEnv !== undefined) process.env.GIT_INDEX_FILE = savedIndexEnv;
    });

    it('keeps the real index byte-identical when the isolated run stages everything', async () => {
        const stageBefore = git(root, ['ls-files', '--stage']);
        const cachedBefore = git(root, ['diff', '--cached']);
        const unstagedBefore = git(root, ['diff']);

        await withIsolatedIndex(root, undefined, ({ env }) => {
            git(root, ['add', '-A'], { ...env });
            expect(git(root, ['diff', '--cached', '--name-only'], { ...env })).toContain('src/new.ts');
            return Promise.resolve();
        });

        expect(git(root, ['ls-files', '--stage'])).toBe(stageBefore);
        expect(git(root, ['diff', '--cached'])).toBe(cachedBefore);
        expect(git(root, ['diff'])).toBe(unstagedBefore);
        expect(git(root, ['diff'])).toContain('line 19 unstaged');
    });

    it('exposes untracked files to git diff HEAD inside the isolated index only', async () => {
        const inside = await withIsolatedIndex(root, undefined, ({ env }) =>
            Promise.resolve(git(root, ['diff', 'HEAD', '--name-only'], { ...env })),
        );
        expect(inside.split('\n')).toEqual(expect.arrayContaining(['a.txt', 'src/new.ts']));
        expect(git(root, ['diff', 'HEAD', '--name-only'])).not.toContain('src/new.ts');
    });

    it.each([
        [['a.txt'], ['a.txt']],
        [['src/new.ts'], ['src/new.ts']],
        [['docs/with space.md'], ['docs/with space.md']],
        [
            ['a.txt', 'src/new.ts'],
            ['a.txt', 'src/new.ts'],
        ],
    ])('scopes git diff <diffBase> to %j without touching the real index', async (scope, expected) => {
        write(root, 'docs/with space.md', '# untracked\n');
        write(root, 'committed.txt', 'edited, out of scope\n');
        const stageBefore = git(root, ['ls-files', '--stage']);
        const listed = await withIsolatedIndex(root, scope, ({ env, diffBase }) =>
            Promise.resolve(git(root, ['diff', '--name-only', '-z', '--diff-filter=ACMR', diffBase], { ...env })),
        );
        expect(listed.split('\0').filter(Boolean).sort()).toEqual(expected);
        expect(git(root, ['ls-files', '--stage'])).toBe(stageBefore);
    });

    it('removes the temp index even when the callback throws', async () => {
        let tempIndex = '';
        await expect(
            withIsolatedIndex(root, undefined, ({ env }) => {
                tempIndex = env.GIT_INDEX_FILE;
                return Promise.reject(new Error('boom'));
            }),
        ).rejects.toThrow('boom');
        expect(tempIndex).not.toBe('');
        expect(fs.existsSync(tempIndex)).toBe(false);
    });

    it('works inside a linked worktree where .git is a file', async () => {
        git(root, ['stash', '-q', '--include-untracked']);
        const worktree = path.join(root, '..', `${path.basename(root)}-wt`);
        git(root, ['worktree', 'add', '-q', '-b', 'wt', worktree]);
        try {
            expect(fs.statSync(path.join(worktree, '.git')).isFile()).toBe(true);
            write(worktree, 'wt-only.ts', 'export {};\n');
            const stageBefore = git(worktree, ['ls-files', '--stage']);
            await withIsolatedIndex(worktree, undefined, ({ env }) => {
                git(worktree, ['add', '-A'], { ...env });
                return Promise.resolve();
            });
            expect(git(worktree, ['ls-files', '--stage'])).toBe(stageBefore);
        } finally {
            fs.rmSync(worktree, { recursive: true, force: true });
        }
    });

    it('snapshotIndex detects a real git add', () => {
        const before = snapshotIndex(root);
        expect(snapshotIndex(root)).toBe(before);
        git(root, ['add', 'a.txt']);
        expect(snapshotIndex(root)).not.toBe(before);
    });

    it('getChangedFiles returns staged files for pre-commit and tracked plus untracked for working-tree', () => {
        write(root, 'committed.txt', 'edited but not staged\n');
        expect(getChangedFiles('pre-commit', root)).toEqual(['a.txt']);
        expect(getChangedFiles('working-tree', root)).toEqual(['a.txt', 'committed.txt', 'src/new.ts']);
    });
});
