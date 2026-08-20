#!/usr/bin/env node
/**
 * Print a compact JSON array of publishable workspace packages:
 * [{ "name": "@kristijorgji/cli-kit", "dir": "cli-kit" }, ...]
 *
 * Used by CI to build a per-package matrix. No install required.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const packagesDir = join(repoRoot, 'packages');

const packages = [];
for (const dir of readdirSync(packagesDir, { withFileTypes: true })) {
    if (!dir.isDirectory()) continue;
    const manifestPath = join(packagesDir, dir.name, 'package.json');
    let manifest;
    try {
        manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    } catch {
        continue;
    }
    if (manifest.private === true) continue;
    if (typeof manifest.name !== 'string') continue;
    packages.push({ name: manifest.name, dir: dir.name });
}

packages.sort((a, b) => a.name.localeCompare(b.name));
process.stdout.write(JSON.stringify(packages));
