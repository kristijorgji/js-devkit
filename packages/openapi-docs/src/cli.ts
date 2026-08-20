#!/usr/bin/env node
import { Command } from 'commander';

import { logFatalAndExitFromError } from '@kristijorgji/cli-kit';

import { runCheck } from './commands/check.js';
import { runDocs } from './commands/docs.js';
import { runOpen } from './commands/open.js';
import { runPostman } from './commands/postman.js';
import { loadConfig } from './config/load-config.js';

const program = new Command();

program.name('kj-openapi').description('API route docs and Postman collection from an OpenAPI document');

program
    .command('docs')
    .description('Write markdown, JSON, and HTML API route docs')
    .action(async () => {
        const config = await loadConfig();
        runDocs(config);
    });

program
    .command('check')
    .description('Fail when committed API route docs drift from the generator')
    .action(async () => {
        const config = await loadConfig();
        runCheck(config);
    });

program
    .command('open')
    .description('Open the HTML API route viewer')
    .option('--serve', 'serve viewer over HTTP instead of opening a file:// URL', false)
    .option('--port <n>', 'HTTP port when --serve is set', '4012')
    .action(async (options: { serve?: boolean; port?: string }) => {
        const config = await loadConfig();
        runOpen(config, { serve: Boolean(options.serve), port: Number(options.port ?? 4012) });
    });

program
    .command('postman')
    .description('Write a Postman collection from the OpenAPI document')
    .action(async () => {
        const config = await loadConfig();
        await runPostman(config);
    });

program.parseAsync(process.argv).catch((error: unknown) => {
    logFatalAndExitFromError(error);
});
