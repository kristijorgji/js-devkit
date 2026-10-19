import type { Gate, GateMode } from '../types.js';

const BOTH_MODES: readonly GateMode[] = ['pre-commit', 'working-tree'];

export function workspaceScript(options: {
    id: string;
    workspace: string;
    script: string;
    modes?: readonly GateMode[];
    dependsOn?: readonly string[];
    whenChanged?: readonly string[];
    envByMode?: Partial<Record<GateMode, Record<string, string>>>;
}): Gate {
    const prefixes = options.whenChanged;
    return {
        id: options.id,
        modes: options.modes ?? BOTH_MODES,
        scope: 'repo',
        dependsOn: options.dependsOn,
        when: prefixes
            ? (ctx) => ctx.changedFiles.some((file) => prefixes.some((prefix) => file.startsWith(prefix)))
            : undefined,
        command: (ctx) => {
            const base = ctx.packageManager.runWorkspaceScript(options.workspace, options.script);
            const env = options.envByMode?.[ctx.mode];
            return env ? { ...base, env } : base;
        },
    };
}
