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
