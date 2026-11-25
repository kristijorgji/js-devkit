import fs from 'node:fs';
import path from 'node:path';

import { checkSharedConsumers, type SharedConsumersBaseline } from '../analyzers/shared-consumers/check-shared-consumers.js';
import { collectConsumerImports } from '../analyzers/shared-consumers/collect-consumer-imports.js';
import { computeSharedConsumers } from '../analyzers/shared-consumers/compute-shared-consumers.js';
import { type PackageExportsField } from '../analyzers/shared-consumers/resolve-package-exports.js';
import { createSharedPackageIndex } from '../analyzers/shared-consumers/shared-package-index.js';
import { resolveSharedConsumersConfig } from '../lib/config.js';
import { logger } from '../lib/logger.js';
import { walkDirectory } from '../lib/walk-directory.js';

const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.mts', '.cts', '.js', '.jsx', '.mjs', '.cjs']);
const TODO_REASON = 'TODO: move to its single consumer or document why it is shared';

export interface SharedConsumersFlags {
    root?: string;
    writeBaseline: boolean;
    json: boolean;
}

function readJsonFile<T>(filePath: string, fallback: T): T {
    if (!fs.existsSync(filePath)) {
        return fallback;
    }
    return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
}

function listPackageFiles(packageDir: string, ignoreDirectories: string[]): string[] {
    const files: string[] = [];
    walkDirectory(
        packageDir,
        (filePath) => {
            if (!SOURCE_EXTENSIONS.has(path.extname(filePath))) {
                return;
            }
            files.push(path.relative(packageDir, filePath).split(path.sep).join('/'));
        },
        { ignoreDirectories }
    );
    return files.sort();
}

function readBaseline(filePath: string): SharedConsumersBaseline {
    if (!fs.existsSync(filePath)) {
        return {};
    }
    return JSON.parse(fs.readFileSync(filePath, 'utf8')) as SharedConsumersBaseline;
}

export async function runSharedConsumersCommand(flags: SharedConsumersFlags): Promise<void> {
    const config = resolveSharedConsumersConfig({ cwd: process.cwd(), flags });

    for (const pkg of config.packages) {
        const packageDir = path.resolve(config.repoRoot, pkg.dir);
        const packageJson = readJsonFile<{ name?: string; exports?: PackageExportsField }>(
            path.join(packageDir, 'package.json'),
            {}
        );
        if (!packageJson.name || !packageJson.exports) {
            throw new Error(`${pkg.dir}: package.json must have "name" and "exports"`);
        }

        const imports = collectConsumerImports({
            repoRoot: config.repoRoot,
            packageName: packageJson.name,
            consumers: config.consumers,
            ignoreDirectories: config.ignoreDirectories,
            ignoreFilePatterns: config.ignoreFilePatterns,
        });
        const index = createSharedPackageIndex(packageDir, packageJson.exports);
        const direct = new Map<string, Set<string>>();
        for (const item of imports) {
            for (const file of index.declaringFiles(item.subpath, item.names)) {
                const consumers = direct.get(file) ?? new Set<string>();
                consumers.add(item.consumer);
                direct.set(file, consumers);
            }
        }
        const consumers = computeSharedConsumers(direct, index.internalEdges());
        const baselinePath = path.resolve(config.repoRoot, pkg.baselineFile);
        const baseline = readBaseline(baselinePath);
        const result = checkSharedConsumers({
            files: listPackageFiles(packageDir, config.ignoreDirectories),
            consumers,
            minConsumers: pkg.minConsumers,
            sharedConsumers: pkg.sharedConsumers,
            ignore: pkg.ignore,
            isBarrel: index.isBarrel,
            baseline,
        });

        if (flags.json) {
            logger.info(JSON.stringify({ dir: pkg.dir, ...result }, null, 2));
        }

        if (flags.writeBaseline) {
            const next: SharedConsumersBaseline = {};
            for (const violation of result.violations) {
                next[violation.file] = {
                    consumers: violation.consumers,
                    reason: baseline[violation.file]?.reason ?? TODO_REASON,
                };
            }
            const sorted: SharedConsumersBaseline = {};
            for (const file of Object.keys(next).sort()) {
                const entry = next[file];
                if (entry) {
                    sorted[file] = entry;
                }
            }
            fs.mkdirSync(path.dirname(baselinePath), { recursive: true });
            fs.writeFileSync(baselinePath, `${JSON.stringify(sorted, null, 2)}\n`);
            logger.info(`wrote ${path.relative(config.repoRoot, baselinePath)}`);
            continue;
        }

        if (result.newViolations.length === 0 && result.stale.length === 0) {
            continue;
        }

        for (const violation of result.newViolations) {
            const usedBy = violation.consumers.length > 0 ? violation.consumers.join(', ') : 'no consumers';
            logger.error(
                `${pkg.dir}/${violation.file}: used by ${usedBy} only; move it to that consumer or add a reasoned entry to ${pkg.baselineFile}`
            );
        }
        for (const file of result.stale) {
            logger.error(`${pkg.dir}/${file}: no longer violates; remove it from ${pkg.baselineFile}`);
        }
        process.exitCode = 1;
    }
}
