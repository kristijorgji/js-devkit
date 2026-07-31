#!/usr/bin/env node
import { runTestMocksCommand } from './commands/test-mocks.js';

const HELP_TEXT = `kj-analyze <command> [options]

Commands:
  test-mocks   Find near-duplicate vi.mock/jest.mock factories

Options for test-mocks:
  --root <path>
  --scan <path>          (repeatable)
  --out <path>
  --min-occurrences <n>
  --min-lines <n>
  --similarity <0-1>
  --ignore <dirname>     (repeatable, appends to defaults)
  --help
`;

interface ParsedArgs {
    command?: string;
    root?: string;
    scan: string[];
    out?: string;
    minOccurrences?: number;
    minLines?: number;
    similarity?: number;
    ignore: string[];
    help: boolean;
}

function printHelp(): void {
    console.log(HELP_TEXT);
}

export function parseArgs(argv: string[]): ParsedArgs {
    const parsed: ParsedArgs = { scan: [], ignore: [], help: false };

    let index = 0;
    if (argv[0] && !argv[0].startsWith('-')) {
        parsed.command = argv[0];
        index = 1;
    }

    for (; index < argv.length; index += 1) {
        const arg = argv[index];
        switch (arg) {
            case '--help':
            case '-h':
                parsed.help = true;
                break;
            case '--root':
                parsed.root = argv[(index += 1)];
                break;
            case '--scan':
                parsed.scan.push(argv[(index += 1)] ?? '');
                break;
            case '--out':
                parsed.out = argv[(index += 1)];
                break;
            case '--min-occurrences':
                parsed.minOccurrences = Number(argv[(index += 1)]);
                break;
            case '--min-lines':
                parsed.minLines = Number(argv[(index += 1)]);
                break;
            case '--similarity':
                parsed.similarity = Number(argv[(index += 1)]);
                break;
            case '--ignore':
                parsed.ignore.push(argv[(index += 1)] ?? '');
                break;
            default:
                break;
        }
    }

    return parsed;
}

async function main(): Promise<void> {
    const argv = process.argv.slice(2);
    const parsed = parseArgs(argv);

    if (!parsed.command || parsed.help) {
        printHelp();
        process.exitCode = parsed.help ? 0 : 1;
        return;
    }

    switch (parsed.command) {
        case 'test-mocks':
            await runTestMocksCommand({
                root: parsed.root,
                scanPaths: parsed.scan.length > 0 ? parsed.scan : undefined,
                out: parsed.out,
                minOccurrences: parsed.minOccurrences,
                minLines: parsed.minLines,
                similarityThreshold: parsed.similarity,
                ignoreDirectories: parsed.ignore.length > 0 ? parsed.ignore : undefined,
            });
            break;
        default:
            console.error(`Unknown command: ${parsed.command}`);
            printHelp();
            process.exitCode = 1;
    }
}

main().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
});
