import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import type { IsolatedIndex } from './git-state.js';
import type { Gate, GateCommand, GateContext } from './types.js';

export interface PlannedGate {
    gate: Gate;
    /** Set when the gate is planned but will not run (e.g. `when` not triggered). */
    skipReason?: string;
}

export interface PlanOptions {
    gateIds?: readonly string[];
    filesOnly: boolean;
}

/** Filters gates by mode, `--gates` / `--files` selection, and `when` triggers. Pure. */
export function planGates(gates: readonly Gate[], ctx: GateContext, options: PlanOptions): PlannedGate[] {
    return gates
        .filter((gate) => gate.modes.includes(ctx.mode))
        .filter((gate) => !options.gateIds || options.gateIds.includes(gate.id))
        .filter((gate) => !options.filesOnly || gate.scope === 'files')
        .map((gate) =>
            gate.when && !gate.when(ctx) ? { gate, skipReason: 'not triggered by changed files' } : { gate },
        );
}

export type GateStatus = 'passed' | 'failed' | 'skipped';

export interface GateResult {
    id: string;
    status: GateStatus;
    durationMs: number;
    exitCode: number | null;
    logPath?: string;
    skipReason?: string;
    /** Combined stdout/stderr with ANSI escapes stripped. */
    output: string;
}

export interface SpawnResult {
    exitCode: number | null;
    output: string;
}

export interface RunnerDeps {
    spawnGate: (command: GateCommand, options: { cwd: string; logPath: string }) => Promise<SpawnResult>;
    withIsolatedIndex: <T>(fn: (isolated: IsolatedIndex) => Promise<T>) => Promise<T>;
}

export interface RunOptions {
    cwd: string;
    failFast: boolean;
    logDir: string;
}

function skipped(id: string, skipReason: string): GateResult {
    return { id, status: 'skipped', durationMs: 0, exitCode: null, skipReason, output: '' };
}

function blockingDependency(gate: Gate, results: readonly GateResult[]): GateResult | undefined {
    return (gate.dependsOn ?? [])
        .map((dep) => results.find((result) => result.id === dep))
        .find((result) => result !== undefined && result.status !== 'passed');
}

async function runOne(gate: Gate, ctx: GateContext, options: RunOptions, deps: RunnerDeps): Promise<GateResult> {
    const logPath = path.join(options.logDir, `${gate.id}.txt`);
    const started = Date.now();
    const run = (runCtx: GateContext, extraEnv: Record<string, string>): Promise<SpawnResult> => {
        const command = gate.command(runCtx);
        process.stdout.write(`\n▶ ${gate.id}: ${describeCommand(command)}\n`);
        return deps.spawnGate({ ...command, env: { ...command.env, ...extraEnv } }, { cwd: options.cwd, logPath });
    };
    const result =
        gate.isolatedIndex && ctx.mode === 'working-tree'
            ? await deps.withIsolatedIndex(({ env, diffBase }) => run({ ...ctx, diffBase }, env))
            : await run(ctx, {});
    return {
        id: gate.id,
        status: result.exitCode === 0 ? 'passed' : 'failed',
        durationMs: Date.now() - started,
        exitCode: result.exitCode,
        logPath,
        output: result.output,
    };
}

/** Runs planned gates sequentially; parallel turbo/knip runs fight over CPU and the turbo cache. */
export async function runGates(
    plan: readonly PlannedGate[],
    ctx: GateContext,
    options: RunOptions,
    deps: RunnerDeps,
): Promise<GateResult[]> {
    const results: GateResult[] = [];
    for (const { gate, skipReason } of plan) {
        if (skipReason) {
            results.push(skipped(gate.id, skipReason));
            continue;
        }
        if (options.failFast && results.some((result) => result.status === 'failed')) {
            results.push(skipped(gate.id, 'earlier gate failed (fail-fast)'));
            continue;
        }
        const blocker = blockingDependency(gate, results);
        if (blocker) {
            results.push(skipped(gate.id, `dependency ${blocker.id} ${blocker.status}`));
            continue;
        }
        results.push(await runOne(gate, ctx, options, deps));
    }
    return results;
}

function describeCommand({ cmd, args }: GateCommand): string {
    return [cmd, ...args].join(' ');
}

const ANSI_PATTERN = /\u001B\[[0-?]*[ -/]*[@-~]/g;

export function stripAnsi(text: string): string {
    return text.replace(ANSI_PATTERN, '');
}

/** Spawns the gate command, streaming output to the console and teeing it (ANSI-stripped) to `logPath`. */
export function spawnGate(command: GateCommand, options: { cwd: string; logPath: string }): Promise<SpawnResult> {
    return new Promise((resolve) => {
        const log = fs.createWriteStream(options.logPath);
        const chunks: string[] = [];
        const child = spawn(command.cmd, command.args, {
            cwd: options.cwd,
            env: {
                ...process.env,
                ...(process.stdout.isTTY ? { FORCE_COLOR: '1' } : {}),
                ...command.env,
            },
            stdio: ['inherit', 'pipe', 'pipe'],
        });
        const onData = (target: NodeJS.WriteStream) => (data: Buffer) => {
            target.write(data);
            const plain = stripAnsi(data.toString('utf8'));
            chunks.push(plain);
            log.write(plain);
        };
        child.stdout.on('data', onData(process.stdout));
        child.stderr.on('data', onData(process.stderr));
        let finished = false;
        const finish = (exitCode: number | null, extra = ''): void => {
            if (finished) return;
            finished = true;
            if (extra) {
                chunks.push(extra);
                log.write(extra);
            }
            log.end(() => resolve({ exitCode, output: chunks.join('') }));
        };
        child.on('error', (error) => finish(1, `\nFailed to start ${command.cmd}: ${error.message}\n`));
        child.on('close', (code) => finish(code));
    });
}
