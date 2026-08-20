import { existsSync, readFileSync } from 'node:fs';

import type { BundleHistoryEntry } from '../snapshot/types.js';

function readHistoryFile(path: string): BundleHistoryEntry[] {
    try {
        const raw = readFileSync(path, 'utf8');
        const parsed = JSON.parse(raw) as BundleHistoryEntry[];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

export function loadBundleHistory(historyPath: string): BundleHistoryEntry[] {
    if (!existsSync(historyPath)) {
        return [];
    }

    return readHistoryFile(historyPath);
}

export function findPreviousEntry(history: BundleHistoryEntry[], currentCommitSha: string): BundleHistoryEntry | null {
    for (let index = history.length - 1; index >= 0; index -= 1) {
        const entry = history[index];
        if (entry && entry.commitSha !== currentCommitSha) {
            return entry;
        }
    }

    return null;
}

export function findBaselineEntry(
    history: BundleHistoryEntry[],
    currentCommitSha: string,
    explicitBaselineSha?: string,
): BundleHistoryEntry | null {
    if (explicitBaselineSha) {
        const match = history.find(
            (entry) => entry.commitSha === explicitBaselineSha || entry.commitSha.startsWith(explicitBaselineSha),
        );
        return match ?? null;
    }

    const existing = history.find((entry) => entry.commitSha === currentCommitSha);
    if (existing) {
        return existing;
    }

    return findPreviousEntry(history, currentCommitSha);
}
