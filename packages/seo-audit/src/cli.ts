#!/usr/bin/env node
import { logFatalAndExitFromError } from '@kristijorgji/cli-kit';

import { loadConfig } from './config/load-config.js';
import { runPagesAudit } from './pages/run.js';
import { runSitemapChecks } from './sitemaps/run.js';

const USAGE = 'Usage: kj-seo <sitemaps|pages> <baseUrl> [options]  (kj-seo <command> --help for options)';

async function main(): Promise<void> {
    const [command, ...rest] = process.argv.slice(2).filter((arg, index) => !(index === 0 && arg === '--'));
    if (command === '--help' || command === '-h') {
        process.stdout.write(`${USAGE}\n`);
        return;
    }
    if (command !== 'sitemaps' && command !== 'pages') {
        process.stderr.write(`${USAGE}\n`);
        process.exitCode = 1;
        return;
    }
    const config = await loadConfig();
    const failed = command === 'sitemaps' ? await runSitemapChecks(rest, config) : await runPagesAudit(rest, config);
    if (failed) process.exitCode = 1;
}

main().catch((error: unknown) => logFatalAndExitFromError(error));
