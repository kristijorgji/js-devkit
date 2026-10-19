import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { createPackageManager } from '../package-manager.js';
import type { Gate } from '../types.js';

import { findConfigFile, loadConfig, resolveQualityGatesConfig } from './load-config.js';
import type { QualityGatesConfig } from './types.js';

const echo: Gate = {
    id: 'echo',
    modes: ['working-tree'],
    scope: 'repo',
    command: () => ({ cmd: 'echo', args: ['ok'] }),
};

function baseConfig(overrides: Partial<QualityGatesConfig> = {}): QualityGatesConfig {
    return { packageManager: 'pnpm', gates: [echo], ...overrides };
}

describe('resolveQualityGatesConfig', () => {
    it('applies defaults', () => {
        const resolved = resolveQualityGatesConfig(baseConfig(), '/tmp');
        expect(resolved.packageManager.name).toBe('pnpm');
        expect(resolved.packageRoots).toEqual(['apps', 'packages']);
        expect(resolved.logDir).toBe('.quality-gates');
        expect(resolved.workingTreeScript).toBe('pnpm quality:working-tree');
        expect(resolved.gates).toHaveLength(1);
    });

    it('requires unique non-empty gates', () => {
        expect(() => resolveQualityGatesConfig(baseConfig({ gates: [] }), '/tmp')).toThrow(/gates/);
        expect(() =>
            resolveQualityGatesConfig(baseConfig({ gates: [echo, { ...echo, id: 'echo' }] }), '/tmp'),
        ).toThrow(/duplicate gate ids: echo/);
    });

    it('uses the adapter formatScript for workingTreeScript', () => {
        const resolved = resolveQualityGatesConfig(baseConfig({ packageManager: 'npm' }), '/tmp');
        expect(resolved.workingTreeScript).toBe('npm run quality:working-tree --');
        expect(createPackageManager('npm').formatScript('quality:working-tree')).toBe(resolved.workingTreeScript);
    });
});

describe('loadConfig', () => {
    let dir: string;

    afterEach(() => {
        if (dir) rmSync(dir, { recursive: true, force: true });
    });

    it('loads a TypeScript config via jiti', async () => {
        dir = mkdtempSync(join(tmpdir(), 'quality-gates-config-'));
        writeFileSync(join(dir, 'package.json'), JSON.stringify({ packageManager: 'pnpm@9.15.4' }));
        writeFileSync(
            join(dir, 'quality-gates.config.ts'),
            `export default {
                packageManager: 'pnpm',
                gates: [{
                    id: 'echo',
                    modes: ['working-tree'],
                    scope: 'repo',
                    command: () => ({ cmd: 'echo', args: ['ok'] }),
                }],
            };\n`,
        );
        const loaded = await loadConfig(dir);
        expect(loaded.gates.map((gate) => gate.id)).toEqual(['echo']);
        expect(findConfigFile(dir)).toBe(join(dir, 'quality-gates.config.ts'));
    });

    it('throws when the config file is missing', async () => {
        dir = mkdtempSync(join(tmpdir(), 'quality-gates-config-'));
        await expect(loadConfig(dir)).rejects.toThrow(/No quality-gates.config.ts found/);
    });
});
