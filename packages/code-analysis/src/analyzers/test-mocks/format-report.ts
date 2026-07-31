import path from 'node:path';

import {
    DEFAULT_SIMILARITY_THRESHOLD,
    type AnalyzeTestMocksResult,
    type MockModuleGroup,
    type TopSimilarPair,
} from './analyze-test-mocks.js';

function formatStatusLabel(group: MockModuleGroup): string {
    if (group.status === 'near-duplicate' && group.topSimilarPair) {
        const percent = Math.round(group.topSimilarPair.score * 100);
        return `near-duplicate (max ${percent}%)`;
    }

    return group.status;
}

function formatSimilarPair(repoRoot: string, pair: TopSimilarPair): string {
    const left = path.relative(repoRoot, pair.left.filePath);
    const right = path.relative(repoRoot, pair.right.filePath);
    const percent = Math.round(pair.score * 100);
    return `- Closest pair (${percent}%): \`${left}:${pair.left.line}\` ↔ \`${right}:${pair.right.line}\``;
}

export function formatReport(
    result: AnalyzeTestMocksResult,
    options: { repoRoot: string; minOccurrences: number; minLines: number; similarityThreshold?: number }
): string {
    const similarityThreshold = options.similarityThreshold ?? DEFAULT_SIMILARITY_THRESHOLD;
    const lines: string[] = [
        '# Test mock usage report',
        '',
        `Scanned **${result.scannedFiles}** test files.`,
        `Thresholds: >= **${options.minOccurrences}** non-delegating occurrences, >= **${options.minLines}** lines per mock, near-duplicate >= **${Math.round(similarityThreshold * 100)}%** similarity.`,
        '',
    ];

    if (result.groups.length === 0) {
        lines.push('No extraction candidates matched the thresholds.');
    } else {
        for (const group of result.groups) {
            lines.push(
                `## ${group.groupKey}`,
                '',
                `- Kind: ${group.specifierKind}`,
                `- Status: **${formatStatusLabel(group)}**`,
                `- Occurrences: ${group.occurrences.length} (${group.nonDelegatingOccurrences.length} non-delegating)`,
                `- Max lines: ${group.maxLineCount}`
            );

            if (group.topSimilarPair && group.status !== 'identical') {
                lines.push(formatSimilarPair(options.repoRoot, group.topSimilarPair));
            }

            lines.push(
                '',
                '| File | Line | Lines | Delegates | Factory hash |',
                '| ---- | ---- | ----- | --------- | ------------ |'
            );

            for (const occurrence of group.occurrences) {
                const relativePath = path.relative(options.repoRoot, occurrence.filePath);
                const delegates = occurrence.delegatesToHelper ? 'yes' : 'no';
                lines.push(
                    `| \`${relativePath}\` | ${occurrence.line} | ${occurrence.lineCount} | ${delegates} | ${occurrence.factoryHash ?? '—'} |`
                );
            }

            lines.push('');
        }
    }

    if (result.alreadyUsingHelpers.length > 0) {
        lines.push('## Already using shared mock helpers', '');
        lines.push('These module groups have fewer than the required non-delegating inline mocks.', '');

        for (const group of result.alreadyUsingHelpers) {
            lines.push(`### ${group.groupKey}`, '');
            lines.push(
                `- Kind: ${group.specifierKind}`,
                `- Total occurrences: ${group.allOccurrences.length}`,
                `- Delegating to shared helper: ${group.delegatingOccurrences.length}`,
                '',
                '| File | Line | Lines | Delegates |',
                '| ---- | ---- | ----- | --------- |'
            );

            for (const occurrence of group.allOccurrences) {
                const relativePath = path.relative(options.repoRoot, occurrence.filePath);
                const delegates = occurrence.delegatesToHelper ? 'yes' : 'no';
                lines.push(`| \`${relativePath}\` | ${occurrence.line} | ${occurrence.lineCount} | ${delegates} |`);
            }

            lines.push('');
        }
    }

    if (result.groups.length === 0 && result.alreadyUsingHelpers.length === 0) {
        lines.push('No duplicate multi-line mocks matched the thresholds.');
    }

    return `${lines.join('\n')}\n`;
}
