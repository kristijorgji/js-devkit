import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import {
    SIZE_LIMITS_IGNORE_BASELINE_ENV,
    type SizeLimitsBaseline,
} from '@kristijorgji/eslint-plugin';

import { parseSizeViolation } from './parse-size-violation.js';

export interface CollectSizeViolationsInput {
    repoRoot: string;
    packageDir: string;
    lintPaths: string[];
}

export async function collectSizeViolations(input: CollectSizeViolationsInput): Promise<SizeLimitsBaseline> {
    process.env[SIZE_LIMITS_IGNORE_BASELINE_ENV] = '1';

    const entry = createRequire(path.join(input.repoRoot, 'package.json')).resolve('eslint');
    const { ESLint } = (await import(pathToFileURL(entry).href)) as typeof import('eslint');

    const existing = input.lintPaths.filter((lintPath) => fs.existsSync(path.join(input.packageDir, lintPath)));
    if (existing.length === 0) {
        return {};
    }

    const eslint = new ESLint({ cwd: input.packageDir, errorOnUnmatchedPattern: false });
    const results = await eslint.lintFiles(existing);
    const baseline: SizeLimitsBaseline = {};

    for (const result of results) {
        const file = path.relative(input.packageDir, result.filePath).split(path.sep).join('/');
        for (const message of result.messages) {
            const violation = parseSizeViolation(message);
            if (!violation) continue;
            const entryForFile = baseline[file] ?? {};
            const previous = entryForFile[violation.rule];
            entryForFile[violation.rule] = previous === undefined ? violation.value : Math.max(previous, violation.value);
            baseline[file] = entryForFile;
        }
    }

    return baseline;
}
