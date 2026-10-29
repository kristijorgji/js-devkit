import type { Gate, GateMode } from '../types.js';

const BOTH_MODES: readonly GateMode[] = ['pre-commit', 'working-tree'];

export function lintStaged(options: { id?: string } = {}): Gate {
    return {
        id: options.id ?? 'lint-staged',
        modes: BOTH_MODES,
        scope: 'files',
        isolatedIndex: true,
        command: (ctx) => {
            const extra =
                ctx.mode === 'pre-commit'
                    ? []
                    : ['--diff', ctx.diffBase ?? 'HEAD', '--no-hide-partially-staged'];
            return ctx.packageManager.execBin('lint-staged', extra);
        },
    };
}
