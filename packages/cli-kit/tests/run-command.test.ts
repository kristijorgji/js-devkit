import { spawnSync } from 'node:child_process';

import { describe, expect, it, vi } from 'vitest';

vi.mock('node:child_process', () => ({
    spawnSync: vi.fn(),
}));

const { runCommand } = await import('../src/run-command.js');

describe('runCommand', () => {
    it('exits with the spawned status when the command fails', () => {
        vi.mocked(spawnSync).mockReturnValue({ status: 3 } as ReturnType<typeof spawnSync>);
        const exitSpy = vi.spyOn(process, 'exit').mockImplementation(((code?: number) => {
            throw new Error(`exit:${String(code)}`);
        }) as typeof process.exit);

        expect(() => runCommand('false', [], { cwd: process.cwd() })).toThrow('exit:3');
        expect(exitSpy).toHaveBeenCalledWith(3);
        exitSpy.mockRestore();
    });

    it('does not exit when the command succeeds', () => {
        vi.mocked(spawnSync).mockReturnValue({ status: 0 } as ReturnType<typeof spawnSync>);
        const exitSpy = vi.spyOn(process, 'exit').mockImplementation(((code?: number) => {
            throw new Error(`exit:${String(code)}`);
        }) as typeof process.exit);

        expect(() => runCommand('true', [], { cwd: process.cwd() })).not.toThrow();
        expect(exitSpy).not.toHaveBeenCalled();
        exitSpy.mockRestore();
    });
});
