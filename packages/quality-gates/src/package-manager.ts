import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { GateCommand } from './types.js';

export type PackageManagerName = 'pnpm' | 'npm' | 'yarn' | 'bun';

export interface PackageManagerAdapter {
    name: PackageManagerName;
    execBin(bin: string, args?: readonly string[]): GateCommand;
    runScript(script: string, args?: readonly string[]): GateCommand;
    runWorkspaceScript(workspace: string, script: string, args?: readonly string[]): GateCommand;
    formatScript(script: string): string;
}

const KNOWN_MANAGERS: readonly PackageManagerName[] = ['pnpm', 'npm', 'yarn', 'bun'];

function isPackageManagerName(value: string): value is PackageManagerName {
    return (KNOWN_MANAGERS as readonly string[]).includes(value);
}

function withArgs(base: string[], extra: readonly string[] | undefined): string[] {
    return extra && extra.length > 0 ? [...base, ...extra] : base;
}

function pnpmAdapter(): PackageManagerAdapter {
    return {
        name: 'pnpm',
        execBin: (bin, args) => ({ cmd: 'pnpm', args: withArgs(['exec', bin], args) }),
        runScript: (script, args) => ({ cmd: 'pnpm', args: withArgs([script], args) }),
        runWorkspaceScript: (workspace, script, args) => ({
            cmd: 'pnpm',
            args: withArgs(['--filter', workspace, script], args),
        }),
        formatScript: (script) => `pnpm ${script}`,
    };
}

function npmAdapter(): PackageManagerAdapter {
    return {
        name: 'npm',
        execBin: (bin, args) => ({ cmd: 'npx', args: withArgs(['--no-install', bin], args) }),
        runScript: (script, args) => ({
            cmd: 'npm',
            args: args && args.length > 0 ? ['run', script, '--', ...args] : ['run', script],
        }),
        runWorkspaceScript: (workspace, script, args) => ({
            cmd: 'npm',
            args: args && args.length > 0 ? ['run', script, '-w', workspace, '--', ...args] : ['run', script, '-w', workspace],
        }),
        formatScript: (script) => `npm run ${script} --`,
    };
}

function yarnAdapter(): PackageManagerAdapter {
    return {
        name: 'yarn',
        execBin: (bin, args) => ({ cmd: 'yarn', args: withArgs([bin], args) }),
        runScript: (script, args) => ({ cmd: 'yarn', args: withArgs([script], args) }),
        runWorkspaceScript: (workspace, script, args) => ({
            cmd: 'yarn',
            args: withArgs(['workspace', workspace, script], args),
        }),
        formatScript: (script) => `yarn ${script}`,
    };
}

function bunAdapter(): PackageManagerAdapter {
    return {
        name: 'bun',
        execBin: (bin, args) => ({ cmd: 'bunx', args: withArgs([bin], args) }),
        runScript: (script, args) => ({ cmd: 'bun', args: withArgs(['run', script], args) }),
        runWorkspaceScript: (workspace, script, args) => ({
            cmd: 'bun',
            args: withArgs(['run', '--filter', workspace, script], args),
        }),
        formatScript: (script) => `bun run ${script}`,
    };
}

const ADAPTERS: Record<PackageManagerName, () => PackageManagerAdapter> = {
    pnpm: pnpmAdapter,
    npm: npmAdapter,
    yarn: yarnAdapter,
    bun: bunAdapter,
};

export function createPackageManager(name: PackageManagerName): PackageManagerAdapter {
    return ADAPTERS[name]();
}

const LOCKFILES: readonly { file: string; manager: PackageManagerName }[] = [
    { file: 'pnpm-lock.yaml', manager: 'pnpm' },
    { file: 'package-lock.json', manager: 'npm' },
    { file: 'yarn.lock', manager: 'yarn' },
    { file: 'bun.lock', manager: 'bun' },
    { file: 'bun.lockb', manager: 'bun' },
];

export function detectPackageManager(cwd: string): PackageManagerName {
    const pkgPath = join(cwd, 'package.json');
    if (existsSync(pkgPath)) {
        try {
            const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as { packageManager?: unknown };
            if (typeof pkg.packageManager === 'string') {
                const name = pkg.packageManager.split('@')[0] ?? '';
                if (isPackageManagerName(name)) return name;
            }
        } catch {
            // Fall through to lockfile detection.
        }
    }
    for (const { file, manager } of LOCKFILES) {
        if (existsSync(join(cwd, file))) return manager;
    }
    throw new Error(
        `Could not detect a package manager in ${cwd}. Set packageManager in quality-gates.config.ts (pnpm | npm | yarn | bun).`,
    );
}

export function resolvePackageManager(
    spec: PackageManagerName | 'auto' | undefined,
    cwd: string,
): PackageManagerAdapter {
    const name = spec && spec !== 'auto' ? spec : detectPackageManager(cwd);
    return createPackageManager(name);
}
