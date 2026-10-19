import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('./git-state.js', async (importOriginal) => {
    const actual = await importOriginal<typeof import('./git-state.js')>();
    return {
        ...actual,
        getRepoRoot: () => {
            throw new Error('git should not run for --help');
        },
    };
});

import { runCli } from './run.js';

describe('runCli help', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('prints help without resolving a git repo', async () => {
        const exit = vi.spyOn(process, 'exit').mockImplementation((code) => {
            throw new Error(`exit ${String(code)}`);
        });
        await expect(runCli(['--help'])).rejects.toThrow('exit 0');
        expect(exit).toHaveBeenCalledWith(0);
    });
});
