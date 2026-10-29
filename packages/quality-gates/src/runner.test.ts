import os from 'node:os';
import path from 'node:path';

import { describe, expect, it, vi } from 'vitest';

import { examplePresetGates, pnpmContext } from './test-helpers.js';
import type { GateCommand, GateContext } from './types.js';
import type { GateResult, GateStatus, PlannedGate, RunnerDeps, SpawnResult } from './runner.js';
import { planGates, runGates, stripAnsi } from './runner.js';

const GATES = examplePresetGates();

function plannedIds(plan: readonly PlannedGate[]): string[] {
    return plan.map(({ gate }) => gate.id);
}

describe('planGates', () => {
    it('pre-commit runs lint-staged, knip, build and size-limit', () => {
        const plan = planGates(GATES, pnpmContext({ mode: 'pre-commit' }), { filesOnly: false });
        expect(plannedIds(plan)).toEqual(['lint-staged', 'knip', 'build', 'size-limit']);
    });

    it('working-tree adds typecheck before build', () => {
        const plan = planGates(GATES, pnpmContext(), { filesOnly: false });
        expect(plannedIds(plan)).toEqual(['lint-staged', 'knip', 'typecheck', 'build', 'size-limit']);
    });

    it('--files keeps only file-scoped gates', () => {
        const plan = planGates(GATES, pnpmContext({ files: ['a.ts'] }), { filesOnly: true });
        expect(plannedIds(plan)).toEqual(['lint-staged']);
    });

    it('--gates keeps only the selected gates', () => {
        const plan = planGates(GATES, pnpmContext(), { gateIds: ['knip'], filesOnly: false });
        expect(plannedIds(plan)).toEqual(['knip']);
    });

    it.each([
        ['apps/web/src/x.ts', true],
        ['packages/utils/src/y.ts', true],
        ['apps/backend/src/z.ts', false],
    ])('size-limit trigger for %s is %s', (file, triggered) => {
        const plan = planGates(GATES, pnpmContext({ changedFiles: [file] }), {
            gateIds: ['size-limit'],
            filesOnly: false,
        });
        expect(plan[0]?.skipReason === undefined).toBe(triggered);
    });
});

function stubDeps(exitCodes: Partial<Record<string, number>>): RunnerDeps & { calls: GateCommand[] } {
    const calls: GateCommand[] = [];
    return {
        calls,
        spawnGate: (command: GateCommand, { logPath }): Promise<SpawnResult> => {
            calls.push(command);
            const id = path.basename(logPath, '.txt');
            return Promise.resolve({ exitCode: exitCodes[id] ?? 0, output: `${id} output` });
        },
        withIsolatedIndex: (fn) => fn({ env: { GIT_INDEX_FILE: '/tmp/isolated.index' }, diffBase: 'tree-sha' }),
    };
}

async function run(
    exitCodes: Partial<Record<string, number>>,
    ctx: GateContext,
    failFast: boolean,
): Promise<{ results: GateResult[]; deps: ReturnType<typeof stubDeps> }> {
    vi.spyOn(process.stdout, 'write').mockReturnValue(true);
    const deps = stubDeps(exitCodes);
    const plan = planGates(GATES, ctx, { filesOnly: false });
    const results = await runGates(plan, ctx, { cwd: os.tmpdir(), failFast, logDir: os.tmpdir() }, deps);
    vi.restoreAllMocks();
    return { results, deps };
}

function statuses(results: readonly GateResult[]): Record<string, GateStatus> {
    return Object.fromEntries(results.map((result) => [result.id, result.status]));
}

describe('runGates', () => {
    const webChange = pnpmContext({ changedFiles: ['apps/web/src/a.ts'] });

    it('skips build and size-limit after a typecheck failure but still runs independent gates', async () => {
        const { results } = await run({ typecheck: 1 }, webChange, false);
        expect(statuses(results)).toEqual({
            'lint-staged': 'passed',
            knip: 'passed',
            typecheck: 'failed',
            build: 'skipped',
            'size-limit': 'skipped',
        } satisfies Record<string, GateStatus>);
        expect(results.find((result) => result.id === 'build')?.skipReason).toBe('dependency typecheck failed');
    });

    it('skips size-limit after a build failure', async () => {
        const { results } = await run({ build: 1 }, webChange, false);
        expect(statuses(results)['size-limit']).toBe('skipped');
    });

    it('fail-fast stops after the first failure in pre-commit', async () => {
        const { results, deps } = await run({ 'lint-staged': 1 }, { ...webChange, mode: 'pre-commit' }, true);
        expect(deps.calls).toHaveLength(1);
        expect(statuses(results)).toEqual({
            'lint-staged': 'failed',
            knip: 'skipped',
            build: 'skipped',
            'size-limit': 'skipped',
        } satisfies Record<string, GateStatus>);
    });

    it('runs lint-staged with the isolated index only in working-tree mode', async () => {
        const working = await run({}, webChange, false);
        expect(working.deps.calls[0]?.env).toEqual({
            GIT_INDEX_FILE: '/tmp/isolated.index',
        } satisfies GateCommand['env']);
        expect(working.deps.calls[0]?.args).toEqual([
            'exec',
            'lint-staged',
            '--diff',
            'tree-sha',
            '--no-hide-partially-staged',
        ]);
        const preCommit = await run({}, { ...webChange, mode: 'pre-commit' }, true);
        expect(preCommit.deps.calls[0]?.env).toEqual({} satisfies GateCommand['env']);
    });
});

describe('stripAnsi', () => {
    it('strips ANSI escapes from captured output', () => {
        expect(stripAnsi('\u001B[31merror\u001B[39m')).toBe('error');
    });
});
