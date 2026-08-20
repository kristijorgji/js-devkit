import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

export function walkFiles(dir: string, predicate: (absPath: string) => boolean): string[] {
    const results: string[] = [];
    for (const entry of readdirSync(dir)) {
        const abs = join(dir, entry);
        if (statSync(abs).isDirectory()) {
            results.push(...walkFiles(abs, predicate));
        } else if (predicate(abs)) {
            results.push(abs);
        }
    }
    return results;
}
