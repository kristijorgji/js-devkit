import { describe, expect, it } from 'vitest';

import type { CliArgs } from './args.js';
import { UsageError, isHelpOrVersion, parseArgs, peekConfigPath } from './args.js';

const KNOWN = ['lint-staged', 'knip', 'typecheck', 'build', 'size-limit'];

describe('parseArgs', () => {
    it('parses mode, files and gates', () => {
        expect(parseArgs(['--mode', 'working-tree', '--files', 'a.ts', 'b.ts'], KNOWN)).toEqual({
            mode: 'working-tree',
            files: ['a.ts', 'b.ts'],
            gateIds: undefined,
            configPath: undefined,
        } satisfies CliArgs);
        expect(parseArgs(['--', '--mode', 'working-tree', '--gates', 'knip,typecheck'], KNOWN).gateIds).toEqual([
            'knip',
            'typecheck',
        ]);
    });

    it.each([
        [[]],
        [['--mode', 'nope']],
        [['--mode', 'working-tree', '--gates', 'unknown']],
        [['--mode', 'pre-commit', '--files', 'a.ts']],
        [['--mode', 'working-tree', '--files', 'a.ts', '--gates', 'knip']],
    ])('rejects %j', (argv) => {
        expect(() => parseArgs(argv, KNOWN)).toThrow(UsageError);
    });
});

describe('isHelpOrVersion', () => {
    it('detects help and version flags', () => {
        expect(isHelpOrVersion(['--help'])).toBe(true);
        expect(isHelpOrVersion(['-h'])).toBe(true);
        expect(isHelpOrVersion(['--version'])).toBe(true);
        expect(isHelpOrVersion(['-V'])).toBe(true);
        expect(isHelpOrVersion(['--mode', 'working-tree'])).toBe(false);
    });
});

describe('peekConfigPath', () => {
    it('reads --config and --config=', () => {
        expect(peekConfigPath(['--mode', 'working-tree', '--config', 'foo.ts'])).toBe('foo.ts');
        expect(peekConfigPath(['--config=bar.ts', '--mode', 'working-tree'])).toBe('bar.ts');
        expect(peekConfigPath(['--mode', 'working-tree'])).toBeUndefined();
    });
});
