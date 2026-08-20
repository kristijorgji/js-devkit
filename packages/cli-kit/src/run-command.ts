import { spawnSync } from 'node:child_process';

export function runCommand(
    command: string,
    args: string[],
    options: { cwd: string; env?: Record<string, string | undefined> } = { cwd: process.cwd() },
): void {
    const result = spawnSync(command, args, {
        cwd: options.cwd,
        stdio: 'inherit',
        env: { ...process.env, ...options.env },
    });
    if (result.status !== 0) {
        process.exit(result.status ?? 1);
    }
}
