import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { createPackageManager, detectPackageManager } from './package-manager.js';

describe('package manager argv', () => {
    it('pnpm matches Prona365 gate commands', () => {
        const pm = createPackageManager('pnpm');
        expect(pm.execBin('lint-staged')).toEqual({ cmd: 'pnpm', args: ['exec', 'lint-staged'] });
        expect(pm.execBin('lint-staged', ['--diff', 'HEAD'])).toEqual({
            cmd: 'pnpm',
            args: ['exec', 'lint-staged', '--diff', 'HEAD'],
        });
        expect(pm.runScript('knip')).toEqual({ cmd: 'pnpm', args: ['knip'] });
        expect(pm.execBin('turbo', ['build', '--filter=...[HEAD]'])).toEqual({
            cmd: 'pnpm',
            args: ['exec', 'turbo', 'build', '--filter=...[HEAD]'],
        });
        expect(pm.runWorkspaceScript('@repo/web', 'size-limit')).toEqual({
            cmd: 'pnpm',
            args: ['--filter', '@repo/web', 'size-limit'],
        });
        expect(pm.formatScript('quality:working-tree')).toBe('pnpm quality:working-tree');
    });

    it('npm uses npx --no-install and npm run', () => {
        const pm = createPackageManager('npm');
        expect(pm.execBin('lint-staged', ['--diff', 'HEAD'])).toEqual({
            cmd: 'npx',
            args: ['--no-install', 'lint-staged', '--diff', 'HEAD'],
        });
        expect(pm.runScript('knip')).toEqual({ cmd: 'npm', args: ['run', 'knip'] });
        expect(pm.runWorkspaceScript('@repo/web', 'size-limit')).toEqual({
            cmd: 'npm',
            args: ['run', 'size-limit', '-w', '@repo/web'],
        });
        expect(pm.formatScript('quality:working-tree')).toBe('npm run quality:working-tree --');
    });

    it('yarn uses yarn bin / workspace', () => {
        const pm = createPackageManager('yarn');
        expect(pm.execBin('lint-staged')).toEqual({ cmd: 'yarn', args: ['lint-staged'] });
        expect(pm.runScript('knip')).toEqual({ cmd: 'yarn', args: ['knip'] });
        expect(pm.runWorkspaceScript('@repo/web', 'size-limit')).toEqual({
            cmd: 'yarn',
            args: ['workspace', '@repo/web', 'size-limit'],
        });
        expect(pm.formatScript('quality:working-tree')).toBe('yarn quality:working-tree');
    });

    it('bun uses bunx and bun run --filter (best-effort)', () => {
        const pm = createPackageManager('bun');
        expect(pm.execBin('lint-staged')).toEqual({ cmd: 'bunx', args: ['lint-staged'] });
        expect(pm.runScript('knip')).toEqual({ cmd: 'bun', args: ['run', 'knip'] });
        expect(pm.runWorkspaceScript('@repo/web', 'size-limit')).toEqual({
            cmd: 'bun',
            args: ['run', '--filter', '@repo/web', 'size-limit'],
        });
        expect(pm.formatScript('quality:working-tree')).toBe('bun run quality:working-tree');
    });
});

describe('detectPackageManager', () => {
    let dir: string;

    afterEach(() => {
        if (dir) rmSync(dir, { recursive: true, force: true });
    });

    it('prefers package.json#packageManager over lockfiles', () => {
        dir = mkdtempSync(join(tmpdir(), 'qg-pm-'));
        writeFileSync(join(dir, 'package.json'), JSON.stringify({ packageManager: 'pnpm@9.15.4' }));
        writeFileSync(join(dir, 'yarn.lock'), '');
        expect(detectPackageManager(dir)).toBe('pnpm');
    });

    it('falls back to lockfiles', () => {
        dir = mkdtempSync(join(tmpdir(), 'qg-pm-'));
        mkdirSync(dir, { recursive: true });
        writeFileSync(join(dir, 'package-lock.json'), '{}');
        expect(detectPackageManager(dir)).toBe('npm');
    });

    it('throws when nothing matches', () => {
        dir = mkdtempSync(join(tmpdir(), 'qg-pm-'));
        writeFileSync(join(dir, 'package.json'), '{}');
        expect(() => detectPackageManager(dir)).toThrow(/Set packageManager/);
    });
});
