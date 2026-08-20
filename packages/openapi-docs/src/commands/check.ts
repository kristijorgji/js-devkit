import { existsSync, readFileSync } from 'node:fs';

import { cliLogger, logFatalAndExit } from '@kristijorgji/cli-kit';

import type { ResolvedOpenApiDocsConfig } from '../config/types.js';

import { generateOutputs } from './docs.js';

function unifiedDiff(path: string, expected: string, actual: string | null): string {
    if (actual === null) {
        return `--- ${path} (missing)\n+++ ${path} (generated)\n`;
    }
    if (expected === actual) return '';
    return `--- ${path} (committed)\n+++ ${path} (generated)\ncommitted length ${actual.length}, generated length ${expected.length}`;
}

export function runCheck(config: ResolvedOpenApiDocsConfig): void {
    const { files } = generateOutputs(config);
    const diffs: string[] = [];
    for (const [path, expected] of Object.entries(files)) {
        const actual = existsSync(path) ? readFileSync(path, 'utf8') : null;
        if (actual !== expected) {
            diffs.push(unifiedDiff(path, expected, actual));
        }
    }
    if (diffs.length === 0) {
        cliLogger.info('API route docs are up to date.');
        return;
    }
    for (const diff of diffs) {
        console.error(diff);
    }
    logFatalAndExit('API route docs are out of date. Run kj-openapi docs.');
}
