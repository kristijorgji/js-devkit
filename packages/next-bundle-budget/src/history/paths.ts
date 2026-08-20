import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

export const BUNDLE_HISTORY_FILENAME = 'history.json';
export const BUNDLE_VIEWER_FILENAME = 'viewer.html';

export function resolveBundleHistoryPath(historyDir: string): string {
    return join(historyDir, BUNDLE_HISTORY_FILENAME);
}

export function resolveBundleViewerPath(historyDir: string): string {
    return join(historyDir, BUNDLE_VIEWER_FILENAME);
}

export function ensureBundleHistoryDir(historyDir: string): void {
    mkdirSync(historyDir, { recursive: true });
}
