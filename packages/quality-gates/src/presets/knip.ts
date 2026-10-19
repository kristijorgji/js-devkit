import type { Gate, GateMode } from '../types.js';

const BOTH_MODES: readonly GateMode[] = ['pre-commit', 'working-tree'];

export function knip(options: { id?: string; via?: 'script' | 'bin' } = {}): Gate {
    const via = options.via ?? 'script';
    return {
        id: options.id ?? 'knip',
        modes: BOTH_MODES,
        scope: 'repo',
        command: (ctx) =>
            via === 'script' ? ctx.packageManager.runScript('knip') : ctx.packageManager.execBin('knip'),
    };
}
