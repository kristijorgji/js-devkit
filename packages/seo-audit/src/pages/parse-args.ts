import { Command, CommanderError, InvalidArgumentError } from 'commander';

import type { ResolvedSeoAuditConfig } from '../config/types.js';
import type { SeoAuditArgs, Severity } from './types.js';

function parsePositiveInt(flag: string, raw: string): number {
    const parsed = Number(raw);
    if (!Number.isInteger(parsed) || parsed < 1) {
        throw new InvalidArgumentError(`\`${flag}\` must be a positive integer`);
    }
    return parsed;
}

function parseLighthouseCount(raw: string): number {
    const parsed = Number(raw);
    if (!Number.isInteger(parsed) || parsed < 0) {
        throw new InvalidArgumentError('`--lighthouse` must be a non-negative integer');
    }
    return parsed;
}

function parseFailOn(raw: string): Severity | 'none' {
    if (raw === 'error' || raw === 'warn' || raw === 'none') {
        return raw;
    }
    throw new InvalidArgumentError('`--fail-on` must be error, warn, or none');
}

export function parseSeoAuditArgs(
    argv: string[],
    envSecret: string | undefined,
    locales: ResolvedSeoAuditConfig['locales'],
): SeoAuditArgs {
    function parseLocales(raw: string): string[] {
        const parsed = raw
            .split(',')
            .map((locale) => locale.trim())
            .filter((locale) => locale.length > 0);
        if (locales.supported.length === 0) {
            if (parsed.length === 0) {
                throw new InvalidArgumentError(`unknown locales: ${raw}`);
            }
            return parsed;
        }
        const unknown = parsed.filter((locale) => !locales.supported.includes(locale));
        if (parsed.length === 0 || unknown.length > 0) {
            throw new InvalidArgumentError(`unknown locales: ${unknown.join(', ') || raw}`);
        }
        return parsed;
    }

    const program = new Command()
        .name('kj-seo pages')
        .description('Audit rendered pages for titles, canonicals, hreflang, robots, and Open Graph')
        .argument('<baseUrl>', 'Origin, e.g. https://www.example.com')
        .option('--secret <token>', 'Sitemap secret (falls back to the configured secretEnv)', envSecret?.trim())
        .option('--max-urls <n>', 'Maximum pages to fetch', (value) => parsePositiveInt('--max-urls', value), 500)
        .option(
            '--crawl-depth <n>',
            'Link depth beyond sitemap seeds',
            (value) => parsePositiveInt('--crawl-depth', value),
            2,
        )
        .option('--concurrency <n>', 'Parallel fetches', (value) => parsePositiveInt('--concurrency', value), 4)
        .option('--locales <csv>', 'Locales to seed', parseLocales, [...locales.indexable])
        .option('--lighthouse <n>', 'Lighthouse sample size (0 skips it)', parseLighthouseCount, 0)
        .option('--out <dir>', 'Report directory')
        .option('--fail-on <level>', 'Exit 1 at this severity', parseFailOn, 'error')
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
    const opts = program.opts<{
        secret?: string;
        maxUrls: number;
        crawlDepth: number;
        concurrency: number;
        locales: string[];
        lighthouse: number;
        out?: string;
        failOn: Severity | 'none';
    }>();
    const secret = opts.secret?.trim() || undefined;
    return {
        baseUrl: raw.replace(/\/+$/, ''),
        secret,
        maxUrls: opts.maxUrls,
        crawlDepth: opts.crawlDepth,
        concurrency: opts.concurrency,
        locales: opts.locales,
        lighthouse: opts.lighthouse,
        ...(opts.out ? { outDir: opts.out } : {}),
        failOn: opts.failOn,
    };
}
