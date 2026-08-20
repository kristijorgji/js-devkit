import { writeFileSync } from 'node:fs';

import type { BundleHistoryEntry } from '../snapshot/types.js';

import { ensureBundleHistoryDir } from './paths.js';

const MAX_HISTORY_ENTRIES = 200;

export function upsertHistoryEntry(history: BundleHistoryEntry[], entry: BundleHistoryEntry): BundleHistoryEntry[] {
    const existingIndex = history.findIndex((item) => item.commitSha === entry.commitSha);
    const nextHistory =
        existingIndex === -1
            ? [...history, entry]
            : history.map((item, index) => (index === existingIndex ? entry : item));

    return nextHistory
        .sort((left, right) => Date.parse(left.timestamp) - Date.parse(right.timestamp))
        .slice(-MAX_HISTORY_ENTRIES);
}

export function saveBundleHistory(historyPath: string, historyDir: string, history: BundleHistoryEntry[]): void {
    ensureBundleHistoryDir(historyDir);
    writeFileSync(historyPath, `${JSON.stringify(history, null, 2)}\n`, 'utf8');
}
