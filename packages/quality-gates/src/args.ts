import { Command, CommanderError, InvalidArgumentError, Option } from 'commander';

import { GATE_MODES, type GateMode } from './types.js';

export interface CliArgs {
    mode: GateMode;
    files?: string[];
    gateIds?: string[];
    configPath?: string;
}

export class UsageError extends Error {}

function parseGateIds(value: string, knownGateIds: readonly string[]): string[] {
    const ids = value.split(',').filter((id) => id.length > 0);
    const unknown = ids.filter((id) => !knownGateIds.includes(id));
    if (ids.length === 0 || unknown.length > 0) {
        throw new InvalidArgumentError(`Known gates: ${knownGateIds.join(', ')}`);
    }
    return ids;
}

interface ProgramOptions {
    mode?: GateMode;
    files?: string[];
    gates?: string[];
    config?: string;
}

function buildProgram(knownGateIds: readonly string[]): Command {
    return new Command()
        .name('kj-quality-gates')
        .description('Run shared quality gates from quality-gates.config')
        .addOption(new Option('--mode <mode>', 'which file set and index handling to use').choices([...GATE_MODES]))
        .option('--files <paths...>', 'working-tree only: re-run file-scoped gates for these paths')
        .option(
            '--gates <ids>',
            `working-tree only: comma-separated gates to run (${knownGateIds.join(', ')})`,
            (value: string) => parseGateIds(value, knownGateIds),
        )
        .option('--config <path>', 'path to quality-gates.config file')
        .exitOverride()
        .configureOutput({ writeErr: () => undefined });
}

function validate({ mode, files, gates: gateIds, config }: ProgramOptions): CliArgs {
    if (!mode) throw new UsageError(`--mode is required (${GATE_MODES.join(' | ')})`);
    if (mode === 'pre-commit' && (files || gateIds)) {
        throw new UsageError('--files and --gates are only supported with --mode working-tree');
    }
    if (files && gateIds) throw new UsageError('Use either --files or --gates, not both');
    return { mode, files, gateIds, configPath: config };
}

export function isHelpOrVersion(argv: readonly string[]): boolean {
    return argv.some((arg) => arg === '--help' || arg === '-h' || arg === '--version' || arg === '-V');
}

/** Parses user args (without the node/script prefix). Throws `UsageError` on invalid input. */
export function parseArgs(argv: readonly string[], knownGateIds: readonly string[]): CliArgs {
    const program = buildProgram(knownGateIds);
    try {
        program.parse(
            argv.filter((arg) => arg !== '--'),
            { from: 'user' },
        );
    } catch (error) {
        if (error instanceof CommanderError && error.exitCode === 0) process.exit(0);
        throw new UsageError(error instanceof Error ? error.message : String(error));
    }
    return validate(program.opts<ProgramOptions>());
}

export function peekConfigPath(argv: readonly string[]): string | undefined {
    const eq = argv.find((arg) => arg.startsWith('--config='));
    if (eq) return eq.slice('--config='.length);
    const index = argv.indexOf('--config');
    const value = index >= 0 ? argv[index + 1] : undefined;
    if (value && !value.startsWith('-')) return value;
    return undefined;
}
