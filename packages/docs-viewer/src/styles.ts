import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ASSETS_DIR = join(dirname(fileURLToPath(import.meta.url)), 'assets');

export function readBaseViewerStyles(): string {
    return readFileSync(join(ASSETS_DIR, 'table-viewer.css'), 'utf8');
}
