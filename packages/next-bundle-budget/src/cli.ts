#!/usr/bin/env node
import { Command } from 'commander';

import { logFatalAndExitFromError } from '@kristijorgji/cli-kit';

import { runCheck } from './commands/check.js';
import { runHistory } from './commands/history.js';
import { runMigrateBudgets } from './commands/migrate-budgets.js';
import { runSyncLimits } from './commands/sync-limits.js';
import { runTrack } from './commands/track.js';
import { loadConfig } from './config/load-config.js';

const program = new Command();

program.name('kj-next-bundle').description('Next.js bundle size budgets, history, and limit sync');

program
    .command('check')
    .description('Enforce Brotli size-limit budgets on production artifacts')
    .option('--skip-track', 'skip bundle history tracking', false)
    .option('--track', 'record a history snapshot after budgets pass', false)
    .action(async (options: { skipTrack?: boolean; track?: boolean }) => {
        const config = await loadConfig();
        runCheck(config, { skipTrack: Boolean(options.skipTrack), track: Boolean(options.track) });
    });

program
    .command('track')
    .description('Record a local bundle snapshot and print diffs against the previous entry')
    .option('--baseline <sha>', 'compare against a specific history entry (full or short SHA)')
    .option('--fail-on-growth', 'exit with code 1 when budgets or routes grew')
    .action(async (options: { baseline?: string; failOnGrowth?: boolean }) => {
        const config = await loadConfig();
        runTrack(config, { baselineSha: options.baseline, failOnGrowth: Boolean(options.failOnGrowth) });
    });

program
    .command('history')
    .description('Render and open the local bundle size history timeline')
    .option('--serve', 'serve viewer over HTTP instead of opening a file:// URL', false)
    .option('--port <n>', 'HTTP port when --serve is set', '4010')
    .action(async (options: { serve?: boolean; port?: string }) => {
        const config = await loadConfig();
        runHistory(config, { serve: Boolean(options.serve), port: Number(options.port ?? 4010) });
    });

program
    .command('sync-limits')
    .description('Suggest or apply lower size-limit caps after bundle shrinkage')
    .option('--apply', 'write updated limits to bundle-budgets.json', false)
    .option('--init-routes', 'reseed all route-owned caps from measured size + 15%', false)
    .action(async (options: { apply?: boolean; initRoutes?: boolean }) => {
        const config = await loadConfig();
        runSyncLimits(config, { apply: Boolean(options.apply), initRoutes: Boolean(options.initRoutes) });
    });

program
    .command('migrate-budgets')
    .description('Convert legacy static-budgets.ts + route-budgets.ts into bundle-budgets.json')
    .option('--out <path>', 'output path (default: budgetsFile from config)')
    .action(async (options: { out?: string }) => {
        const config = await loadConfig();
        runMigrateBudgets(config, options.out);
    });

program.parseAsync(process.argv).catch((error: unknown) => {
    logFatalAndExitFromError(error);
});
