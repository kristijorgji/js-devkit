#!/usr/bin/env node
import { Command } from 'commander';

import { logFatalAndExitFromError } from '@kristijorgji/cli-kit';

import { runUpload } from './commands/upload.js';
import { loadConfig } from './config/load-config.js';

const program = new Command();

program.name('kj-static-assets').description('Upload static assets from a caller-supplied manifest to S3-compatible storage');

program
    .command('upload')
    .description('Upload files from static-assets.config to object storage')
    .option('--dry-run', 'print the upload plan without putting objects', false)
    .action(async (options: { dryRun?: boolean }) => {
        const config = await loadConfig();
        await runUpload(config, { dryRun: Boolean(options.dryRun) });
    });

program.parseAsync(process.argv).catch((error: unknown) => {
    logFatalAndExitFromError(error);
});
