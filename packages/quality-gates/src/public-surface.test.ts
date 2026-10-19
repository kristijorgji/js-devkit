import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const PKG_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONSUMER_BRAND = /prona365|\bprona\b/i;

function walkTs(dir: string): string[] {
    return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) return walkTs(full);
        return entry.name.endsWith('.ts') ? [full] : [];
    });
}

describe('public surface', () => {
    it('README, source, and tests do not name a specific consumer', () => {
        const self = fileURLToPath(import.meta.url);
        const files = [path.join(PKG_ROOT, 'README.md'), ...walkTs(path.join(PKG_ROOT, 'src'))];
        for (const file of files) {
            if (file === self) continue;
            expect(readFileSync(file, 'utf8'), path.relative(PKG_ROOT, file)).not.toMatch(CONSUMER_BRAND);
        }
    });
});
