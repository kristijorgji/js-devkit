import fs from 'node:fs';
import path from 'node:path';

import { analyzeTestMocks } from '../analyzers/test-mocks/analyze-test-mocks.js';
import { formatReport } from '../analyzers/test-mocks/format-report.js';
import { resolveTestMocksConfig, type TestMocksFlags } from '../lib/config.js';
import { logger } from '../lib/logger.js';

export async function runTestMocksCommand(flags: TestMocksFlags): Promise<void> {
    const config = resolveTestMocksConfig({ cwd: process.cwd(), flags, env: process.env });

    if (config.scanPaths.length === 0) {
        logger.warn('No scan paths detected or configured; nothing to analyze.');
        return;
    }

    const result = analyzeTestMocks({
        repoRoot: config.repoRoot,
        scanPaths: config.scanPaths,
        minOccurrences: config.minOccurrences,
        minLines: config.minLines,
        similarityThreshold: config.similarityThreshold,
        ignoreDirectories: config.ignoreDirectories,
        pathAliases: config.pathAliases,
        delegatePatterns: config.delegatePatterns,
    });

    const report = formatReport(result, {
        repoRoot: config.repoRoot,
        minOccurrences: config.minOccurrences,
        minLines: config.minLines,
        similarityThreshold: config.similarityThreshold,
    });

    const outPath = path.resolve(config.repoRoot, config.out);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, report, 'utf8');

    logger.info(`Scanned ${result.scannedFiles} test file(s) across scan path(s): ${config.scanPaths.join(', ')}`);
    logger.info(
        `Found ${result.groups.length} extraction candidate group(s), ${result.alreadyUsingHelpers.length} already using shared helpers.`
    );
    logger.info(`Report written to ${path.relative(process.cwd(), outPath)}`);
}
