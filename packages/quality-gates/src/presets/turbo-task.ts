import type { Gate, GateMode } from '../types.js';

const BOTH_MODES: readonly GateMode[] = ['pre-commit', 'working-tree'];

export function turboTask(options: {
    id: string;
    task: string;
    modes?: readonly GateMode[];
    dependsOn?: readonly string[];
    affected?: boolean;
}): Gate {
    const affected = options.affected ?? true;
    return {
        id: options.id,
        modes: options.modes ?? BOTH_MODES,
        scope: 'repo',
        dependsOn: options.dependsOn,
        command: (ctx) => {
            const filter = affected && ctx.hasHead ? ['--filter=...[HEAD]'] : [];
            return ctx.packageManager.execBin('turbo', [options.task, ...filter]);
        },
    };
}
