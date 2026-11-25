#!/usr/bin/env node
import { runSharedConsumersCommand } from './commands/shared-consumers.js';
import { runSizeBaselineCommand } from './commands/size-baseline.js';
import { runTestMocksCommand } from './commands/test-mocks.js';

const HELP_TEXT = `kj-analyze <command> [options]

Commands:
  test-mocks         Find near-duplicate vi.mock/jest.mock factories
  size-baseline      Generate or check frozen size-limits exemption lists
  shared-consumers   Require shared-package files to have 2+ consumers

Options for test-mocks:
  --root <path>
  --scan <path>          (repeatable)
  --out <path>
  --min-occurrences <n>
  --min-lines <n>
  --similarity <0-1>
  --ignore <dirname>     (repeatable, appends to defaults)
  --help

Options for size-baseline:
  --root <path>
  --package <dir>        (repeatable; filter configured packages by dir)
  --check                Fail if the exemption list is stale; never write
  --allow-new            Allow adding or increasing exemption-list entries
  --help

Options for shared-consumers:
  --root <path>
  --write-baseline       Write the exemption list, keeping existing reasons
  --json                 Print the result object as JSON
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
    packages: string[];
    check: boolean;
    allowNew: boolean;
    writeBaseline: boolean;
    json: boolean;
    help: boolean;
}

function printHelp(): void {
    console.log(HELP_TEXT);
}

export function parseArgs(argv: string[]): ParsedArgs {
    const parsed: ParsedArgs = {
        scan: [],
        ignore: [],
        packages: [],
        check: false,
        allowNew: false,
        writeBaseline: false,
        json: false,
        help: false,
    };

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
            case '--package':
                parsed.packages.push(argv[(index += 1)] ?? '');
                break;
            case '--check':
                parsed.check = true;
                break;
            case '--allow-new':
                parsed.allowNew = true;
                break;
            case '--write-baseline':
                parsed.writeBaseline = true;
                break;
            case '--json':
                parsed.json = true;
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
        case 'size-baseline':
            await runSizeBaselineCommand({
                root: parsed.root,
                packages: parsed.packages,
                check: parsed.check,
                allowNew: parsed.allowNew,
            });
            break;
        case 'shared-consumers':
            await runSharedConsumersCommand({
                root: parsed.root,
                writeBaseline: parsed.writeBaseline,
                json: parsed.json,
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
