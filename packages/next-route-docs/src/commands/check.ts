import { existsSync, readFileSync } from 'node:fs';

import { cliLogger, logFatalAndExit } from '@kristijorgji/cli-kit';

import type { ResolvedRouteDocsConfig } from '../config/types.js';

import { generateOutputs } from './generate.js';

function unifiedDiff(path: string, expected: string, actual: string | null): string {
    if (actual === null) {
        return `--- ${path} (missing)\n+++ ${path} (generated)\n`;
    }
    if (expected === actual) return '';
    return `--- ${path} (committed)\n+++ ${path} (generated)\ncommitted length ${actual.length}, generated length ${expected.length}`;
}

export function runCheck(config: ResolvedRouteDocsConfig): void {
    const { files } = generateOutputs(config);
    const diffs: string[] = [];
    for (const [path, expected] of Object.entries(files)) {
        const actual = existsSync(path) ? readFileSync(path, 'utf8') : null;
        if (actual !== expected) {
            diffs.push(unifiedDiff(path, expected, actual));
        }
    }
    if (diffs.length === 0) {
        cliLogger.info('Route docs are up to date.');
        return;
    }
    for (const diff of diffs) {
        console.error(diff);
    }
    logFatalAndExit('Route docs are out of date. Run kj-next-routes generate.');
}
