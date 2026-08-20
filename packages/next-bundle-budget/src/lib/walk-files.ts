import { readdirSync } from 'node:fs';
import { join } from 'node:path';

/** Recursively list all file paths under a directory. */
export function walkFiles(directory: string): string[] {
    const entries = readdirSync(directory, { withFileTypes: true });
    const files: string[] = [];
    for (const entry of entries) {
        const fullPath = join(directory, entry.name);
        if (entry.isDirectory()) {
            files.push(...walkFiles(fullPath));
        } else if (entry.isFile()) {
            files.push(fullPath);
        }
    }
    return files;
}
