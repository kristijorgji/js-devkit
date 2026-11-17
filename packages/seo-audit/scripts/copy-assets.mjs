import { copyFileSync, mkdirSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = join(root, 'src/sitemaps/schemas');
const destDir = join(root, 'dist/sitemaps/schemas');
mkdirSync(destDir, { recursive: true });
for (const name of readdirSync(srcDir)) {
    if (name.endsWith('.xsd')) {
        copyFileSync(join(srcDir, name), join(destDir, name));
    }
}
