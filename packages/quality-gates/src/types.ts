import type { PackageManagerAdapter } from './package-manager.js';

export type GateMode = 'pre-commit' | 'working-tree';

export const GATE_MODES: readonly GateMode[] = ['pre-commit', 'working-tree'];

export interface GateCommand {
    cmd: string;
    args: string[];
    env?: Record<string, string>;
}

export interface GateContext {
    mode: GateMode;
    /** Repo-relative paths: staged files (pre-commit) or tracked changes vs HEAD plus untracked (working-tree). */
    changedFiles: readonly string[];
    /** Repo-relative paths passed via `--files` (working-tree only). */
    files?: readonly string[];
    hasHead: boolean;
    /** Set inside the isolated index: ref or tree whose `git diff` lists exactly the files in scope. */
    diffBase?: string;
    packageManager: PackageManagerAdapter;
}

export interface Gate {
    id: string;
    modes: readonly GateMode[];
    /** Only `files` gates run under `--files`. */
    scope: 'files' | 'repo';
    /** In working-tree mode, run against a temporary copy of the git index so the real index is never touched. */
    isolatedIndex?: boolean;
    /** Skipped when a planned dependency failed or was skipped; ignored when the dependency is not planned. */
    dependsOn?: readonly string[];
    when?: (ctx: GateContext) => boolean;
    command: (ctx: GateContext) => GateCommand;
}
