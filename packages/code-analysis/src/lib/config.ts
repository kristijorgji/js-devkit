import fs from 'node:fs';
import path from 'node:path';

import {
    DEFAULT_IGNORE_DIRECTORIES,
    DEFAULT_SCAN_PATHS,
    DEFAULT_SIMILARITY_THRESHOLD,
} from '../analyzers/test-mocks/analyze-test-mocks.js';
import { detectScanPaths } from './detect-scan-paths.js';

const CONFIG_FILE_NAME = 'code-analysis.config.json';
const DEFAULT_MIN_OCCURRENCES = 2;
const DEFAULT_MIN_LINES = 8;
const DEFAULT_OUT = path.join('reports', 'test-mock-usage', 'report.md');

export interface CodeAnalysisFileConfig {
    root?: string;
    scanPaths?: string[];
    minOccurrences?: number;
    minLines?: number;
    similarityThreshold?: number;
    out?: string;
    ignoreDirectories?: string[];
    pathAliases?: Record<string, string>;
    /** Regex source strings, converted to RegExp when resolved. */
    delegatePatterns?: string[];
    sizeBaseline?: {
        baselineFile?: string;
        jsonIndent?: number;
        packages: (string | { dir: string; lintPaths?: string[] })[];
    };
    sharedConsumers?: {
        packages: {
            dir: string;
            minConsumers?: number;
            sharedConsumers?: string[];
            ignore?: string[];
            baselineFile: string;
        }[];
        consumers: { name?: string; dir: string; paths?: string[] }[];
        ignoreDirectories?: string[];
        ignoreFilePatterns?: string[];
    };
}

export interface TestMocksFlags {
    root?: string;
    scanPaths?: string[];
    minOccurrences?: number;
    minLines?: number;
    similarityThreshold?: number;
    out?: string;
    ignoreDirectories?: string[];
}

export interface ResolvedTestMocksConfig {
    repoRoot: string;
    scanPaths: string[];
    minOccurrences: number;
    minLines: number;
    similarityThreshold: number;
    out: string;
    ignoreDirectories: string[];
    pathAliases?: Record<string, string>;
    delegatePatterns?: RegExp[];
}

/** Reads `code-analysis.config.json` from the repo root if present. */
export function loadConfigFile(repoRoot: string): CodeAnalysisFileConfig | null {
    const configPath = path.join(repoRoot, CONFIG_FILE_NAME);
    if (!fs.existsSync(configPath)) {
        return null;
    }

    const raw = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(raw) as CodeAnalysisFileConfig;
}

function parseNumberEnv(value: string | undefined): number | undefined {
    if (value === undefined || value.trim() === '') {
        return undefined;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
}

/**
 * Resolves effective `test-mocks` configuration.
 * Precedence (highest to lowest): CLI flags > environment variables > config
 * file (`code-analysis.config.json`) > built-in defaults.
 */
export function resolveTestMocksConfig(input: {
    cwd: string;
    flags: TestMocksFlags;
    env: NodeJS.ProcessEnv;
}): ResolvedTestMocksConfig {
    const repoRoot = path.resolve(input.cwd, input.flags.root ?? '.');
    const fileConfig = loadConfigFile(repoRoot) ?? {};

    const minOccurrences =
        input.flags.minOccurrences ??
        parseNumberEnv(input.env.MIN_OCCURRENCES) ??
        fileConfig.minOccurrences ??
        DEFAULT_MIN_OCCURRENCES;

    const minLines =
        input.flags.minLines ?? parseNumberEnv(input.env.MIN_LINES) ?? fileConfig.minLines ?? DEFAULT_MIN_LINES;

    const similarityThreshold =
        input.flags.similarityThreshold ??
        parseNumberEnv(input.env.SIMILARITY_THRESHOLD) ??
        fileConfig.similarityThreshold ??
        DEFAULT_SIMILARITY_THRESHOLD;

    const out = input.flags.out ?? fileConfig.out ?? DEFAULT_OUT;

    const scanPaths =
        input.flags.scanPaths && input.flags.scanPaths.length > 0
            ? input.flags.scanPaths
            : (fileConfig.scanPaths ?? detectOrDefaultScanPaths(repoRoot));

    const baseIgnoreDirectories = fileConfig.ignoreDirectories ?? [...DEFAULT_IGNORE_DIRECTORIES];
    const ignoreDirectories =
        input.flags.ignoreDirectories && input.flags.ignoreDirectories.length > 0
            ? [...new Set([...baseIgnoreDirectories, ...input.flags.ignoreDirectories])]
            : baseIgnoreDirectories;

    const delegatePatterns = fileConfig.delegatePatterns?.map((pattern) => new RegExp(pattern));

    return {
        repoRoot,
        scanPaths,
        minOccurrences,
        minLines,
        similarityThreshold,
        out,
        ignoreDirectories,
        pathAliases: fileConfig.pathAliases,
        delegatePatterns,
    };
}

function detectOrDefaultScanPaths(repoRoot: string): string[] {
    const detected = detectScanPaths(repoRoot);
    return detected.length > 0 ? detected : [...DEFAULT_SCAN_PATHS];
}

const DEFAULT_SIZE_BASELINE_FILE = 'size-limits.baseline.json';
const DEFAULT_SIZE_BASELINE_JSON_INDENT = 2;
const DEFAULT_SIZE_BASELINE_LINT_PATHS = ['src'];

export interface SizeBaselineFlags {
    root?: string;
    packages?: string[];
}

export interface ResolvedSizeBaselinePackage {
    dir: string;
    lintPaths: string[];
}

export interface ResolvedSizeBaselineConfig {
    repoRoot: string;
    baselineFile: string;
    jsonIndent: number;
    packages: ResolvedSizeBaselinePackage[];
}

function normalizeSizeBaselinePackage(
    entry: string | { dir: string; lintPaths?: string[] }
): ResolvedSizeBaselinePackage {
    if (typeof entry === 'string') {
        return { dir: entry, lintPaths: [...DEFAULT_SIZE_BASELINE_LINT_PATHS] };
    }
    return {
        dir: entry.dir,
        lintPaths: entry.lintPaths && entry.lintPaths.length > 0 ? entry.lintPaths : [...DEFAULT_SIZE_BASELINE_LINT_PATHS],
    };
}

export function resolveSizeBaselineConfig(input: { cwd: string; flags: SizeBaselineFlags }): ResolvedSizeBaselineConfig {
    const repoRoot = path.resolve(input.cwd, input.flags.root ?? '.');
    const fileConfig = loadConfigFile(repoRoot);
    if (!fileConfig?.sizeBaseline) {
        throw new Error('code-analysis.config.json: missing "sizeBaseline" section');
    }

    const section = fileConfig.sizeBaseline;
    let packages = section.packages.map(normalizeSizeBaselinePackage);
    if (input.flags.packages && input.flags.packages.length > 0) {
        const allowed = new Set(input.flags.packages);
        packages = packages.filter((pkg) => allowed.has(pkg.dir));
    }

    return {
        repoRoot,
        baselineFile: section.baselineFile ?? DEFAULT_SIZE_BASELINE_FILE,
        jsonIndent: section.jsonIndent ?? DEFAULT_SIZE_BASELINE_JSON_INDENT,
        packages,
    };
}

const DEFAULT_SHARED_CONSUMERS_MIN = 2;
const DEFAULT_SHARED_CONSUMERS_IGNORE_DIRECTORIES = [...DEFAULT_IGNORE_DIRECTORIES];

export interface SharedConsumersFlags {
    root?: string;
}

export interface ResolvedSharedConsumersPackage {
    dir: string;
    minConsumers: number;
    sharedConsumers: string[];
    ignore: RegExp[];
    baselineFile: string;
}

export interface ResolvedSharedConsumer {
    name: string;
    scanDirs: string[];
}

export interface ResolvedSharedConsumersConfig {
    repoRoot: string;
    packages: ResolvedSharedConsumersPackage[];
    consumers: ResolvedSharedConsumer[];
    ignoreDirectories: string[];
    ignoreFilePatterns: RegExp[];
}

function expandConsumerDirs(repoRoot: string, dirPattern: string): string[] {
    if (!dirPattern.endsWith('/*')) {
        return [path.resolve(repoRoot, dirPattern)];
    }
    const parent = path.resolve(repoRoot, dirPattern.slice(0, -2));
    if (!fs.existsSync(parent)) {
        return [];
    }
    return fs
        .readdirSync(parent, { withFileTypes: true })
        .filter((entry) => entry.isDirectory() && fs.existsSync(path.join(parent, entry.name, 'package.json')))
        .map((entry) => path.join(parent, entry.name));
}

export function resolveSharedConsumersConfig(input: {
    cwd: string;
    flags: SharedConsumersFlags;
}): ResolvedSharedConsumersConfig {
    const repoRoot = path.resolve(input.cwd, input.flags.root ?? '.');
    const fileConfig = loadConfigFile(repoRoot);
    if (!fileConfig?.sharedConsumers) {
        throw new Error('code-analysis.config.json: missing "sharedConsumers" section');
    }

    const section = fileConfig.sharedConsumers;
    const ignoreDirectories = section.ignoreDirectories ?? [...DEFAULT_SHARED_CONSUMERS_IGNORE_DIRECTORIES];
    const ignoreFilePatterns = (section.ignoreFilePatterns ?? []).map((pattern) => new RegExp(pattern));

    const packages: ResolvedSharedConsumersPackage[] = section.packages.map((pkg) => ({
        dir: pkg.dir,
        minConsumers: pkg.minConsumers ?? DEFAULT_SHARED_CONSUMERS_MIN,
        sharedConsumers: pkg.sharedConsumers ?? [],
        ignore: (pkg.ignore ?? []).map((pattern) => new RegExp(pattern)),
        baselineFile: pkg.baselineFile,
    }));

    const consumers: ResolvedSharedConsumer[] = [];
    const packageDirs = new Set(packages.map((pkg) => path.resolve(repoRoot, pkg.dir)));
    for (const consumer of section.consumers) {
        const dirs = expandConsumerDirs(repoRoot, consumer.dir);
        for (const absoluteDir of dirs) {
            if (packageDirs.has(absoluteDir)) {
                continue;
            }
            const relativeDir = path.relative(repoRoot, absoluteDir).split(path.sep).join('/');
            const name = consumer.name ?? (relativeDir === '' ? '.' : relativeDir);
            const paths = consumer.paths ?? ['.'];
            consumers.push({
                name,
                scanDirs: paths.map((scanPath) => path.resolve(absoluteDir, scanPath)),
            });
        }
    }

    return { repoRoot, packages, consumers, ignoreDirectories, ignoreFilePatterns };
}
