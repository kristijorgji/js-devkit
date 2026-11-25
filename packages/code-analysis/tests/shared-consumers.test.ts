import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterEach, describe, expect, it } from 'vitest';

import { checkSharedConsumers } from '../src/analyzers/shared-consumers/check-shared-consumers.js';
import { collectConsumerImports } from '../src/analyzers/shared-consumers/collect-consumer-imports.js';
import { computeSharedConsumers } from '../src/analyzers/shared-consumers/compute-shared-consumers.js';
import { createSharedPackageIndex } from '../src/analyzers/shared-consumers/shared-package-index.js';
import { runSharedConsumersCommand } from '../src/commands/shared-consumers.js';
import { walkDirectory } from '../src/lib/walk-directory.js';

const fixtureRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures/shared-consumers');
const sharedDir = path.join(fixtureRoot, 'packages/shared');

function analyze(baseline: Record<string, { consumers: string[]; reason: string }> = {}) {
    const packageJson = JSON.parse(fs.readFileSync(path.join(sharedDir, 'package.json'), 'utf8')) as {
        name: string;
        exports: Record<string, string>;
    };
    const imports = collectConsumerImports({
        repoRoot: fixtureRoot,
        packageName: packageJson.name,
        consumers: [
            { name: 'apps/one', scanDirs: [path.join(fixtureRoot, 'apps/one')] },
            { name: 'apps/two', scanDirs: [path.join(fixtureRoot, 'apps/two')] },
            { name: 'packages/ui', scanDirs: [path.join(fixtureRoot, 'packages/ui')] },
        ],
        ignoreDirectories: ['node_modules', 'dist'],
        ignoreFilePatterns: [/\.test\./],
    });
    const index = createSharedPackageIndex(sharedDir, packageJson.exports);
    const direct = new Map<string, Set<string>>();
    for (const item of imports) {
        for (const file of index.declaringFiles(item.subpath, item.names)) {
            const consumers = direct.get(file) ?? new Set<string>();
            consumers.add(item.consumer);
            direct.set(file, consumers);
        }
    }
    const files: string[] = [];
    walkDirectory(sharedDir, (filePath) => {
        if (path.extname(filePath) === '.ts') {
            files.push(path.relative(sharedDir, filePath).split(path.sep).join('/'));
        }
    });
    return checkSharedConsumers({
        files,
        consumers: computeSharedConsumers(direct, index.internalEdges()),
        minConsumers: 2,
        sharedConsumers: ['packages/ui'],
        ignore: [],
        isBarrel: index.isBarrel,
        baseline,
    });
}

describe('shared-consumers fixture', () => {
    it('reports only lonely.ts as a violation', () => {
        const result = analyze();
        expect(result.violations.map((violation) => violation.file)).toEqual(['src/lonely/lonely.ts']);
        expect(result.newViolations.map((violation) => violation.file)).toEqual(['src/lonely/lonely.ts']);
    });

    it('treats a baseline entry as an allowed exemption', () => {
        const result = analyze({
            'src/lonely/lonely.ts': { consumers: ['apps/one'], reason: 'kept for the fixture' },
        });
        expect(result.newViolations).toEqual([]);
        expect(result.stale).toEqual([]);
        expect(result.violations.map((violation) => violation.file)).toEqual(['src/lonely/lonely.ts']);
    });

    it('reports a baseline entry that no longer violates as stale', () => {
        const result = analyze({
            'src/direct.ts': { consumers: ['apps/one'], reason: 'stale' },
        });
        expect(result.stale).toEqual(['src/direct.ts']);
    });
});

describe('shared-consumers --write-baseline', () => {
    let tempRoot = '';

    afterEach(() => {
        if (tempRoot) {
            fs.rmSync(tempRoot, { recursive: true, force: true });
            tempRoot = '';
        }
        process.exitCode = 0;
    });

    it('keeps an existing reason when rewriting the baseline', async () => {
        tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'shared-consumers-'));
        fs.cpSync(fixtureRoot, tempRoot, { recursive: true });
        const baselinePath = path.join(tempRoot, 'packages/shared/shared-consumers.baseline.json');
        fs.writeFileSync(
            baselinePath,
            `${JSON.stringify({ 'src/lonely/lonely.ts': { consumers: ['apps/one'], reason: 'kept on purpose' } }, null, 2)}\n`
        );

        await runSharedConsumersCommand({ root: tempRoot, writeBaseline: true, json: false });

        const written = JSON.parse(fs.readFileSync(baselinePath, 'utf8')) as Record<
            string,
            { consumers: string[]; reason: string }
        >;
        expect(written['src/lonely/lonely.ts']?.reason).toBe('kept on purpose');
    });
});
