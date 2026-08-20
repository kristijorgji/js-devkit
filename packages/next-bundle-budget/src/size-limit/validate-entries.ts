import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { parseSizeLimitToBytes, unescapeSizeLimitGlobPath } from './limit-format.js';
import type { SizeLimitEntry } from './chunk-groups.js';

function isGlobPath(path: string): boolean {
    return path.includes('*');
}

export function validateSizeLimitEntries(entries: SizeLimitEntry[], appRoot: string): void {
    const names = new Set<string>();

    for (const entry of entries) {
        if (names.has(entry.name)) {
            throw new Error(`Duplicate size-limit budget name: ${entry.name}`);
        }
        names.add(entry.name);
        parseSizeLimitToBytes(entry.limit);
    }

    for (const entry of entries) {
        const paths = Array.isArray(entry.path) ? entry.path : [entry.path];
        for (const path of paths) {
            if (isGlobPath(path)) {
                continue;
            }
            if (!existsSync(join(appRoot, unescapeSizeLimitGlobPath(path)))) {
                throw new Error(`Size-limit path does not exist: ${path}`);
            }
        }
    }
}
