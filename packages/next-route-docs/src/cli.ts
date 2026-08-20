#!/usr/bin/env node
import { Command } from 'commander';

import { logFatalAndExitFromError } from '@kristijorgji/cli-kit';

import { runAudit } from './commands/audit.js';
import { runCheck } from './commands/check.js';
import { runGenerate } from './commands/generate.js';
import { runOpen } from './commands/open.js';
import { loadConfig } from './config/load-config.js';

const program = new Command();

program.name('kj-next-routes').description('Next.js App Router route inventory and declared-vs-built audit');

program
    .command('generate')
    .description('Write markdown, JSON, and HTML route docs')
    .action(async () => {
        const config = await loadConfig();
        runGenerate(config);
    });

program
    .command('check')
    .description('Fail when committed route docs drift from the generator')
    .action(async () => {
        const config = await loadConfig();
        runCheck(config);
    });

program
    .command('audit')
    .description('Compare declared rendering to .next/prerender-manifest.json')
    .action(async () => {
        const config = await loadConfig();
        runAudit(config);
    });

program
    .command('open')
    .description('Open the HTML route viewer')
    .option('--serve', 'serve viewer over HTTP instead of opening a file:// URL', false)
    .option('--port <n>', 'HTTP port when --serve is set', '4011')
    .action(async (options: { serve?: boolean; port?: string }) => {
        const config = await loadConfig();
        runOpen(config, { serve: Boolean(options.serve), port: Number(options.port ?? 4011) });
    });

program.parseAsync(process.argv).catch((error: unknown) => {
    logFatalAndExitFromError(error);
});
