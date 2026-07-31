import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { detectScanPaths } from '../src/lib/detect-scan-paths.js';
import { loadConfigFile, resolveTestMocksConfig } from '../src/lib/config.js';

function makeTempDir(prefix: string): string {
    return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

describe('detectScanPaths', () => {
    let fixtureRoot = '';

    afterEach(() => {
        if (fixtureRoot) {
            fs.rmSync(fixtureRoot, { recursive: true, force: true });
            fixtureRoot = '';
        }
    });

    it('detects apps/*/src and packages/*/src when pnpm-workspace.yaml declares packages', () => {
        fixtureRoot = makeTempDir('detect-scan-paths-');
        fs.writeFileSync(path.join(fixtureRoot, 'pnpm-workspace.yaml'), "packages:\n  - 'packages/*'\n  - 'apps/*'\n");
        fs.mkdirSync(path.join(fixtureRoot, 'apps', 'web', 'src'), { recursive: true });
        fs.mkdirSync(path.join(fixtureRoot, 'apps', 'admin'), { recursive: true });
        fs.mkdirSync(path.join(fixtureRoot, 'packages', 'ui', 'src'), { recursive: true });

        const scanPaths = detectScanPaths(fixtureRoot);

        expect(scanPaths).toEqual(['apps/web/src', 'packages/ui/src']);
    });

    it('falls back to ["src"] when there is no workspace file but a src directory exists', () => {
        fixtureRoot = makeTempDir('detect-scan-paths-');
        fs.mkdirSync(path.join(fixtureRoot, 'src'), { recursive: true });

        expect(detectScanPaths(fixtureRoot)).toEqual(['src']);
    });

    it('returns an empty array when nothing can be detected', () => {
        fixtureRoot = makeTempDir('detect-scan-paths-');

        expect(detectScanPaths(fixtureRoot)).toEqual([]);
    });

    it('ignores pnpm-workspace.yaml files that do not declare packages', () => {
        fixtureRoot = makeTempDir('detect-scan-paths-');
        fs.writeFileSync(path.join(fixtureRoot, 'pnpm-workspace.yaml'), 'onlyBuiltDependencies:\n  - foo\n');
        fs.mkdirSync(path.join(fixtureRoot, 'apps', 'web', 'src'), { recursive: true });

        expect(detectScanPaths(fixtureRoot)).toEqual([]);
    });
});

describe('loadConfigFile', () => {
    let fixtureRoot = '';

    afterEach(() => {
        if (fixtureRoot) {
            fs.rmSync(fixtureRoot, { recursive: true, force: true });
            fixtureRoot = '';
        }
    });

    it('returns null when no config file is present', () => {
        fixtureRoot = makeTempDir('load-config-');

        expect(loadConfigFile(fixtureRoot)).toBeNull();
    });

    it('parses code-analysis.config.json when present', () => {
        fixtureRoot = makeTempDir('load-config-');
        fs.writeFileSync(
            path.join(fixtureRoot, 'code-analysis.config.json'),
            JSON.stringify({ minOccurrences: 5, scanPaths: ['src'] })
        );

        expect(loadConfigFile(fixtureRoot)).toEqual({ minOccurrences: 5, scanPaths: ['src'] });
    });
});

describe('resolveTestMocksConfig precedence', () => {
    let fixtureRoot = '';

    afterEach(() => {
        if (fixtureRoot) {
            fs.rmSync(fixtureRoot, { recursive: true, force: true });
            fixtureRoot = '';
        }
    });

    it('falls back to built-in defaults when nothing else is set', () => {
        fixtureRoot = makeTempDir('resolve-config-');
        fs.mkdirSync(path.join(fixtureRoot, 'src'), { recursive: true });

        const resolved = resolveTestMocksConfig({ cwd: fixtureRoot, flags: {}, env: {} });

        expect(resolved.minOccurrences).toBe(2);
        expect(resolved.minLines).toBe(8);
        expect(resolved.similarityThreshold).toBe(0.8);
        expect(resolved.out).toBe(path.join('reports', 'test-mock-usage', 'report.md'));
        expect(resolved.scanPaths).toEqual(['src']);
        expect(resolved.ignoreDirectories).toEqual(['node_modules', 'dist', 'coverage', '.turbo']);
    });

    it('lets a config file override built-in defaults', () => {
        fixtureRoot = makeTempDir('resolve-config-');
        fs.writeFileSync(
            path.join(fixtureRoot, 'code-analysis.config.json'),
            JSON.stringify({ minOccurrences: 5, minLines: 12, similarityThreshold: 0.9 })
        );

        const resolved = resolveTestMocksConfig({ cwd: fixtureRoot, flags: {}, env: {} });

        expect(resolved.minOccurrences).toBe(5);
        expect(resolved.minLines).toBe(12);
        expect(resolved.similarityThreshold).toBe(0.9);
    });

    it('lets an environment variable override the config file', () => {
        fixtureRoot = makeTempDir('resolve-config-');
        fs.writeFileSync(path.join(fixtureRoot, 'code-analysis.config.json'), JSON.stringify({ minOccurrences: 5 }));

        const resolved = resolveTestMocksConfig({
            cwd: fixtureRoot,
            flags: {},
            env: { MIN_OCCURRENCES: '3' },
        });

        expect(resolved.minOccurrences).toBe(3);
    });

    it('lets a CLI flag override the environment variable and config file', () => {
        fixtureRoot = makeTempDir('resolve-config-');
        fs.writeFileSync(path.join(fixtureRoot, 'code-analysis.config.json'), JSON.stringify({ minOccurrences: 5 }));

        const resolved = resolveTestMocksConfig({
            cwd: fixtureRoot,
            flags: { minOccurrences: 7 },
            env: { MIN_OCCURRENCES: '3' },
        });

        expect(resolved.minOccurrences).toBe(7);
    });

    it('appends --ignore flags to the default ignore directories', () => {
        fixtureRoot = makeTempDir('resolve-config-');

        const resolved = resolveTestMocksConfig({
            cwd: fixtureRoot,
            flags: { ignoreDirectories: ['vendored'] },
            env: {},
        });

        expect(resolved.ignoreDirectories).toEqual(['node_modules', 'dist', 'coverage', '.turbo', 'vendored']);
    });

    it('auto-detects scan paths from a pnpm workspace when none are configured', () => {
        fixtureRoot = makeTempDir('resolve-config-');
        fs.writeFileSync(path.join(fixtureRoot, 'pnpm-workspace.yaml'), "packages:\n  - 'apps/*'\n");
        fs.mkdirSync(path.join(fixtureRoot, 'apps', 'web', 'src'), { recursive: true });

        const resolved = resolveTestMocksConfig({ cwd: fixtureRoot, flags: {}, env: {} });

        expect(resolved.scanPaths).toEqual(['apps/web/src']);
    });

    it('resolves repoRoot relative to cwd using the --root flag', () => {
        fixtureRoot = makeTempDir('resolve-config-');
        const nestedRoot = path.join(fixtureRoot, 'nested-repo');
        fs.mkdirSync(nestedRoot, { recursive: true });

        const resolved = resolveTestMocksConfig({ cwd: fixtureRoot, flags: { root: 'nested-repo' }, env: {} });

        expect(resolved.repoRoot).toBe(nestedRoot);
    });
});
