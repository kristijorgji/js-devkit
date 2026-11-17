import { Command, CommanderError, InvalidArgumentError } from 'commander';

import type { SeoValidateArgs } from './types.js';

function parseSample(raw: string): number | 'all' {
    if (raw === 'all') {
        return 'all';
    }
    const parsed = Number(raw);
    if (!Number.isInteger(parsed) || parsed < 1) {
        throw new InvalidArgumentError('`--sample` must be a positive integer or `all`');
    }
    return parsed;
}

export function parseSeoValidateArgs(argv: string[], envSecret?: string): SeoValidateArgs {
    const program = new Command()
        .name('kj-seo sitemaps')
        .description('Validate robots.txt and sitemaps against a live origin')
        .argument('<baseUrl>', 'Origin, e.g. https://www.example.com')
        .option('--secret <token>', 'Sitemap secret (falls back to the configured secretEnv)', envSecret?.trim())
        .option('--sample <n|all>', 'Sampled page count, or all locs', parseSample, 20)
        .allowExcessArguments(false)
        .showHelpAfterError()
        .exitOverride();
    try {
        program.parse(
            argv.filter((arg) => arg !== '--'),
            { from: 'user' },
        );
    } catch (error: unknown) {
        if (error instanceof CommanderError && error.exitCode === 0) {
            process.exit(0);
        }
        throw error;
    }
    const raw = String(program.args[0] ?? '').trim();
    if (!raw) {
        throw new InvalidArgumentError('Pass a base URL as the first argument, e.g. https://www.example.com');
    }
    const secret = program.opts<{ secret?: string }>().secret?.trim() || undefined;
    return { baseUrl: raw.replace(/\/+$/, ''), secret, sample: program.opts<{ sample: number | 'all' }>().sample };
}
