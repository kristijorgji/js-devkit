#!/usr/bin/env node
/**
 * Pack a workspace package (and its workspace dependency closure), install the
 * tarballs into a temp project, and assert the published shape is consumable:
 *
 * - no leftover `workspace:` protocol in installed package.json files
 * - every `exports` entry resolves and can be dynamically imported
 * - each `bin` entry exits 0 when invoked with `--help`
 *
 * Usage (from repo root, after `pnpm build`):
 *   node scripts/ci/smoke-pack.mjs @kristijorgji/next-bundle-budget
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const packageName = process.argv[2];
if (!packageName) {
    console.error('Usage: node scripts/ci/smoke-pack.mjs <package-name>');
    process.exit(1);
}

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

function run(command, args, options = {}) {
    const result = spawnSync(command, args, {
        encoding: 'utf8',
        ...options,
    });
    if (result.status !== 0) {
        const detail = [result.stdout, result.stderr].filter(Boolean).join('\n');
        throw new Error(`${command} ${args.join(' ')} failed:\n${detail}`);
    }
    return result.stdout;
}

function collectExportEntries(exportsField) {
    if (!exportsField || typeof exportsField === 'string') return [['.', exportsField ?? '.']];
    return Object.entries(exportsField).filter(([key]) => !key.includes('*'));
}

function resolveExportFile(target) {
    if (typeof target === 'string') return target;
    if (target && typeof target === 'object') {
        if (typeof target.import === 'string') return target.import;
        if (target.import) return resolveExportFile(target.import);
        if (typeof target.default === 'string') return target.default;
        if (target.default) return resolveExportFile(target.default);
    }
    throw new Error(`Cannot resolve ESM export target: ${JSON.stringify(target)}`);
}

function normalizeBins(bin) {
    if (!bin) return {};
    if (typeof bin === 'string') {
        return { [packageName.split('/').pop() ?? packageName]: bin };
    }
    return bin;
}

function installedPackageDir(consumerDir, name) {
    return join(consumerDir, 'node_modules', ...name.split('/'));
}

function loadWorkspacePackages() {
    const packagesDir = join(repoRoot, 'packages');
    const byName = new Map();
    for (const dir of readdirSync(packagesDir, { withFileTypes: true })) {
        if (!dir.isDirectory()) continue;
        try {
            const manifest = JSON.parse(readFileSync(join(packagesDir, dir.name, 'package.json'), 'utf8'));
            if (typeof manifest.name === 'string') {
                byName.set(manifest.name, { dir: dir.name, manifest });
            }
        } catch {
            // skip unreadable package folders
        }
    }
    return byName;
}

function workspaceClosure(startName) {
    const workspace = loadWorkspacePackages();
    if (!workspace.has(startName)) {
        throw new Error(`Unknown workspace package: ${startName}`);
    }
    const ordered = [];
    const seen = new Set();
    function visit(name) {
        if (seen.has(name)) return;
        const entry = workspace.get(name);
        if (!entry) return;
        seen.add(name);
        const deps = {
            ...entry.manifest.dependencies,
            ...entry.manifest.optionalDependencies,
        };
        for (const depName of Object.keys(deps)) {
            if (workspace.has(depName)) visit(depName);
        }
        ordered.push(name);
    }
    visit(startName);
    return ordered;
}

const packDir = mkdtempSync(join(tmpdir(), 'js-devkit-pack-'));
const consumerDir = mkdtempSync(join(tmpdir(), 'js-devkit-smoke-'));

try {
    const workspace = loadWorkspacePackages();
    const closure = workspaceClosure(packageName);
    for (const name of closure) {
        const entry = workspace.get(name);
        if (!entry) continue;
        run('pnpm', ['pack', '--pack-destination', packDir], {
            cwd: join(repoRoot, 'packages', entry.dir),
            stdio: 'inherit',
        });
    }

    const tarballs = readdirSync(packDir)
        .filter((name) => name.endsWith('.tgz'))
        .map((name) => join(packDir, name));
    if (tarballs.length === 0) {
        throw new Error(`pnpm pack produced no tarballs in ${packDir}`);
    }

    writeFileSync(
        join(consumerDir, 'package.json'),
        JSON.stringify({ name: 'smoke-consumer', private: true, type: 'module' }, null, 2),
    );
    execFileSync('npm', ['install', '--ignore-scripts', ...tarballs], {
        cwd: consumerDir,
        stdio: 'inherit',
    });

    const installedRoot = installedPackageDir(consumerDir, packageName);
    const installedManifest = JSON.parse(readFileSync(join(installedRoot, 'package.json'), 'utf8'));
    if (JSON.stringify(installedManifest).includes('workspace:')) {
        throw new Error(`${packageName} still contains a workspace: protocol after pack+install`);
    }

    const nodeModules = join(consumerDir, 'node_modules');
    for (const entry of readdirSync(nodeModules, { withFileTypes: true })) {
        if (!entry.isDirectory() || !entry.name.startsWith('@kristijorgji')) continue;
        for (const child of readdirSync(join(nodeModules, entry.name))) {
            const manifestPath = join(nodeModules, entry.name, child, 'package.json');
            let manifest;
            try {
                manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
            } catch {
                continue;
            }
            if (JSON.stringify(manifest).includes('workspace:')) {
                throw new Error(`${manifest.name ?? child} still contains a workspace: protocol after pack+install`);
            }
        }
    }

    const exportEntries = collectExportEntries(installedManifest.exports);
    for (const [subpath, target] of exportEntries) {
        const specifier = subpath === '.' ? packageName : `${packageName}/${subpath.replace(/^\.\//, '')}`;
        const relativeFile = resolveExportFile(target);
        const resolved = join(installedRoot, relativeFile);
        await import(pathToFileURL(resolved).href);
        console.log(`imported ${specifier} -> ${relativeFile}`);
    }

    const bins = normalizeBins(installedManifest.bin);
    for (const [binName, binPath] of Object.entries(bins)) {
        const absoluteBin = join(installedRoot, binPath);
        const help = spawnSync(process.execPath, [absoluteBin, '--help'], {
            cwd: consumerDir,
            encoding: 'utf8',
        });
        if (help.status !== 0) {
            throw new Error(`${binName} --help exited ${help.status}\n${help.stdout}\n${help.stderr}`);
        }
        console.log(`bin ${binName} --help ok`);
    }

    console.log(`smoke-pack ok: ${packageName} (${tarballs.length} tarball(s))`);
    rmSync(packDir, { recursive: true, force: true });
    // Leave consumerDir for the OS. Importing pino-backed packages starts a
    // thread-stream worker; deleting node_modules before that worker exits
    // crashes the process after a successful smoke test.
    process.exit(0);
} catch (error) {
    rmSync(packDir, { recursive: true, force: true });
    rmSync(consumerDir, { recursive: true, force: true });
    throw error;
}
