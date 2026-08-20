import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { BundleHistoryEntry } from '../snapshot/types.js';

const TEMPLATE_PATH = join(dirname(fileURLToPath(import.meta.url)), 'viewer.template.html');

export function renderBundleHistoryHtml(history: BundleHistoryEntry[]): string {
    const template = readFileSync(TEMPLATE_PATH, 'utf8');
    return template.replace('<!-- HISTORY_JSON -->', JSON.stringify(history));
}
