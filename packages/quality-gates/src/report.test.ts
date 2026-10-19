import { describe, expect, it } from 'vitest';

import {
    changedDuringRun,
    citedFiles,
    formatFailures,
    formatSummary,
    rerunCommand,
} from './report.js';
import type { GateResult } from './runner.js';

const PNPM_WORKING_TREE = 'pnpm quality:working-tree';

describe('report', () => {
    const failed: GateResult = {
        id: 'lint-staged',
        status: 'failed',
        durationMs: 1200,
        exitCode: 1,
        logPath: '/repo/.quality-gates/working-tree/lint-staged.txt',
        output: '/repo/apps/web/src/a.ts\n  1:1  error  no-unused-vars\n',
    };

    it('cites repo-relative and package-relative paths from the change set', () => {
        const changed: string[] = ['apps/web/src/a.ts', 'apps/backend/src/b.ts', 'packages/ui/src/c.tsx'];
        expect(citedFiles(failed.output, changed)).toEqual(['apps/web/src/a.ts']);
        expect(citedFiles('@repo/ui:typecheck: src/c.tsx(3,1): error TS2322', changed)).toEqual([
            'packages/ui/src/c.tsx',
        ]);
    });

    it('ignores command-echo lines that list several changed files', () => {
        const changed: string[] = ['apps/web/src/a.ts', 'apps/web/src/b.ts', 'docs/c.md'];
        const output = [
            '✖ eslint --fix /repo/apps/web/src/a.ts /repo/apps/web/src/b.ts:',
            '[COMPLETED] prettier --write /repo/apps/web/src/a.ts /repo/docs/c.md',
            '/repo/apps/web/src/b.ts',
            '  3:1  error  no-restricted-syntax',
        ].join('\n');
        expect(citedFiles(output, changed)).toEqual(['apps/web/src/b.ts']);
    });

    it('builds rerun commands for file and repo gates', () => {
        expect(
            rerunCommand('lint-staged', ['a.ts', 'b.ts'], {
                workingTreeScript: PNPM_WORKING_TREE,
                filesScope: true,
            }),
        ).toBe('pnpm quality:working-tree --files a.ts b.ts');
        expect(
            rerunCommand('lint-staged', [], { workingTreeScript: PNPM_WORKING_TREE, filesScope: true }),
        ).toBe('pnpm quality:working-tree --gates lint-staged');
        expect(
            rerunCommand('typecheck', ['a.ts'], { workingTreeScript: PNPM_WORKING_TREE, filesScope: false }),
        ).toBe('pnpm quality:working-tree --gates typecheck');
    });

    it('prints log path, cited files and rerun command for failures', () => {
        const text = formatFailures([failed], ['apps/web/src/a.ts'], {
            workingTreeScript: PNPM_WORKING_TREE,
            packageRoots: ['apps', 'packages'],
            filesScopedIds: new Set(['lint-staged']),
        });
        expect(text).toContain('lint-staged failed (exit 1)');
        expect(text).toContain(failed.logPath);
        expect(text).toContain('rerun: pnpm quality:working-tree --files apps/web/src/a.ts');
    });

    it('summarises every gate with status and reason', () => {
        const skipped: GateResult = {
            id: 'build',
            status: 'skipped',
            durationMs: 0,
            exitCode: null,
            skipReason: 'dependency typecheck failed',
            output: '',
        };
        const text = formatSummary([failed, skipped]);
        expect(text).toMatch(/lint-staged\s+FAIL\s+1\.2s/);
        expect(text).toMatch(/build\s+SKIP\s+-\s+dependency typecheck failed/);
    });

    it('lists files rewritten during the run, including ones unchanged before', () => {
        const before = new Map<string, string | null>([
            ['a.ts', 'h1'],
            ['b.ts', 'h2'],
        ]);
        const after = new Map<string, string | null>([
            ['a.ts', 'h1'],
            ['b.ts', 'h3'],
            ['docs/generated.md', 'h4'],
        ]);
        expect(changedDuringRun(before, after)).toEqual(['b.ts', 'docs/generated.md']);
    });
});
