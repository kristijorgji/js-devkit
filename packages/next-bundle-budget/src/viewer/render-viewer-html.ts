import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { BundleHistoryEntry } from '../snapshot/types.js';

const TEMPLATE_PATH = join(dirname(fileURLToPath(import.meta.url)), 'viewer.template.html');

export const DEFAULT_VIEWER_TITLE = 'Bundle size history';

export function escapeHtml(value: string): string {
    return value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

export function renderBundleHistoryHtml(
    history: BundleHistoryEntry[],
    viewerTitle: string = DEFAULT_VIEWER_TITLE,
): string {
    const template = readFileSync(TEMPLATE_PATH, 'utf8');
    const title = escapeHtml(viewerTitle);
    return template.replaceAll('__VIEWER_TITLE__', title).replace('<!-- HISTORY_JSON -->', JSON.stringify(history));
}
