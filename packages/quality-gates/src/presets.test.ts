import { describe, expect, it } from 'vitest';

import { pnpmContext, pronaLikeGates } from './test-helpers.js';
import type { Gate, GateCommand } from './types.js';
import { knip } from './presets/knip.js';

function gateById(id: string): Gate {
    const gate = pronaLikeGates().find((candidate) => candidate.id === id);
    if (!gate) throw new Error(`missing gate ${id}`);
    return gate;
}

describe('preset pnpm argv (Prona365 lock)', () => {
    it('pre-commit lint-staged uses the default staged flow', () => {
        expect(gateById('lint-staged').command(pnpmContext({ mode: 'pre-commit' }))).toEqual({
            cmd: 'pnpm',
            args: ['exec', 'lint-staged'],
        } satisfies GateCommand);
    });

    it('working-tree lint-staged diffs against HEAD or the scoped diff base, never pathspecs', () => {
        const lintStagedGate = gateById('lint-staged');
        expect(lintStagedGate.command(pnpmContext()).args).toEqual(['exec', 'lint-staged', '--diff', 'HEAD']);
        expect(lintStagedGate.command(pnpmContext({ files: ['a.ts'], diffBase: 'abc123' })).args).toEqual([
            'exec',
            'lint-staged',
            '--diff',
            'abc123',
        ]);
    });

    it('knip runs the root script', () => {
        expect(gateById('knip').command(pnpmContext())).toEqual({
            cmd: 'pnpm',
            args: ['knip'],
        } satisfies GateCommand);
    });

    it('knip via bin uses exec', () => {
        expect(knip({ via: 'bin' }).command(pnpmContext())).toEqual({
            cmd: 'pnpm',
            args: ['exec', 'knip'],
        } satisfies GateCommand);
    });

    it('size-limit tracks bundle history only in pre-commit', () => {
        const sizeLimit = gateById('size-limit');
        expect(sizeLimit.command(pnpmContext({ mode: 'pre-commit' }))).toEqual({
            cmd: 'pnpm',
            args: ['--filter', '@repo/web', 'size-limit'],
            env: { TRACK_BUNDLE_HISTORY: '1' },
        } satisfies GateCommand);
        expect(sizeLimit.command(pnpmContext()).env).toBeUndefined();
        expect(sizeLimit.command(pnpmContext()).args).toEqual(['--filter', '@repo/web', 'size-limit']);
    });

    it('turbo gates drop the HEAD filter without an initial commit', () => {
        expect(gateById('build').command(pnpmContext({ hasHead: false })).args).toEqual(['exec', 'turbo', 'build']);
        expect(gateById('build').command(pnpmContext()).args).toEqual([
            'exec',
            'turbo',
            'build',
            '--filter=...[HEAD]',
        ]);
        expect(gateById('typecheck').command(pnpmContext()).args).toEqual([
            'exec',
            'turbo',
            'typecheck',
            '--filter=...[HEAD]',
        ]);
    });
});
