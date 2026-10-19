#!/usr/bin/env node
import { EXIT_USAGE_OR_GUARD, runCli } from './run.js';

runCli().then(
    (code) => {
        process.exitCode = code;
    },
    (error: unknown) => {
        process.stderr.write(`\n✖ ${error instanceof Error ? error.message : String(error)}\n`);
        process.exitCode = EXIT_USAGE_OR_GUARD;
    },
);
