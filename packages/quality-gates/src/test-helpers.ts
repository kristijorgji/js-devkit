import { createPackageManager } from './package-manager.js';
import { knip, lintStaged, turboTask, workspaceScript } from './presets/index.js';
import type { Gate, GateContext } from './types.js';

export function pnpmContext(overrides: Partial<GateContext> = {}): GateContext {
    return {
        mode: 'working-tree',
        changedFiles: [],
        hasHead: true,
        packageManager: createPackageManager('pnpm'),
        ...overrides,
    };
}

/** Gate list matching Prona365's historical quality-gates.ts composition. */
export function pronaLikeGates(): Gate[] {
    return [
        lintStaged(),
        knip(),
        turboTask({ id: 'typecheck', task: 'typecheck', modes: ['working-tree'] }),
        turboTask({ id: 'build', task: 'build', dependsOn: ['typecheck'] }),
        workspaceScript({
            id: 'size-limit',
            workspace: '@repo/web',
            script: 'size-limit',
            dependsOn: ['build'],
            whenChanged: ['apps/web/', 'packages/utils/'],
            envByMode: { 'pre-commit': { TRACK_BUNDLE_HISTORY: '1' } },
        }),
    ];
}
