import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import { Project, type SourceFile, SyntaxKind } from 'ts-morph';

import {
    deriveScanRootsFromScanPaths,
    findScanRoot,
    getPathAliases,
    resolvePathAlias,
} from '../../lib/tsconfig-path-aliases.js';
import { DEFAULT_IGNORE_DIRECTORIES, walkDirectory } from '../../lib/walk-directory.js';

export const DEFAULT_SCAN_PATHS = ['src'] as const;
export const DEFAULT_SIMILARITY_THRESHOLD = 0.8;
export { DEFAULT_IGNORE_DIRECTORIES };

/** Union of the delegate-detection patterns used by prior host-repo scripts. */
export const DEFAULT_DELEGATE_PATTERNS: RegExp[] = [
    /\bcreate[A-Z]\w*Mock\w*\s*\(/,
    /(?:await\s+)?import\(\s*['"][^'"]*(?:\/mocks\/|\/testing|__tests__|@test\/)[^'"]*['"]/,
];

export type MockGroupStatus = 'identical' | 'near-duplicate' | 'divergent';

export interface AnalyzeTestMocksOptions {
    repoRoot: string;
    scanPaths?: readonly string[];
    minOccurrences?: number;
    minLines?: number;
    similarityThreshold?: number;
    /** Default: union of both source repos' patterns, see {@link DEFAULT_DELEGATE_PATTERNS}. */
    delegatePatterns?: RegExp[];
    /** Directory names to skip while walking. Default: node_modules, dist, coverage. */
    ignoreDirectories?: string[];
    /** Extra path aliases (prefix -> target relative to a scan root). */
    pathAliases?: Record<string, string>;
}

export interface MockOccurrence {
    filePath: string;
    line: number;
    lineCount: number;
    factoryHash: string | null;
    rawSpecifier: string;
    delegatesToHelper: boolean;
}

export interface SimilarPairRef {
    filePath: string;
    line: number;
}

export interface TopSimilarPair {
    left: SimilarPairRef;
    right: SimilarPairRef;
    score: number;
}

export interface MockModuleGroup {
    groupKey: string;
    specifierKind: 'package' | 'resolved-path';
    occurrences: MockOccurrence[];
    nonDelegatingOccurrences: MockOccurrence[];
    identical: boolean;
    status: MockGroupStatus;
    maxLineCount: number;
    topSimilarPair?: TopSimilarPair;
}

export interface AlreadyUsingHelperGroup {
    groupKey: string;
    specifierKind: 'package' | 'resolved-path';
    delegatingOccurrences: MockOccurrence[];
    allOccurrences: MockOccurrence[];
}

export interface AnalyzeTestMocksResult {
    groups: MockModuleGroup[];
    alreadyUsingHelpers: AlreadyUsingHelperGroup[];
    scannedFiles: number;
}

export interface ResolveMockModuleKeyOptions {
    scanPaths?: readonly string[];
    pathAliases?: Record<string, string>;
}

function unquoteStringLiteral(text: string): string {
    const trimmed = text.trim();
    if (
        (trimmed.startsWith("'") && trimmed.endsWith("'")) ||
        (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
        (trimmed.startsWith('`') && trimmed.endsWith('`'))
    ) {
        return trimmed.slice(1, -1);
    }

    return trimmed;
}

function normalizeFactoryBody(text: string): string {
    return text
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/(^|\s)\/\/.*$/gm, '')
        .replace(/,\s*([}\]])/g, '$1')
        .replace(/\)([}\]])/g, ') $1')
        .replace(/\s+/g, ' ')
        .trim();
}

export function factoryDelegatesToHelper(
    factoryText: string | null,
    patterns: readonly RegExp[] = DEFAULT_DELEGATE_PATTERNS
): boolean {
    if (factoryText === null) {
        return false;
    }

    return patterns.some((pattern) => pattern.test(factoryText));
}

export function tokenizeFactory(text: string): Set<string> {
    return new Set(normalizeFactoryBody(text).match(/[A-Za-z_$][\w$]*|[^\s]/g) ?? []);
}

export function jaccardSimilarity(left: Set<string>, right: Set<string>): number {
    if (left.size === 0 && right.size === 0) {
        return 1;
    }

    if (left.size === 0 || right.size === 0) {
        return 0;
    }

    let intersection = 0;
    for (const token of left) {
        if (right.has(token)) {
            intersection += 1;
        }
    }

    return intersection / (left.size + right.size - intersection);
}

export function factoryJaccardSimilarity(leftFactory: string, rightFactory: string): number {
    return jaccardSimilarity(tokenizeFactory(leftFactory), tokenizeFactory(rightFactory));
}

export function hashFactoryBody(factoryText: string | null): string | null {
    if (factoryText === null) {
        return null;
    }

    const normalized = normalizeFactoryBody(factoryText);
    if (normalized.length === 0) {
        return null;
    }

    return createHash('sha256').update(normalized).digest('hex').slice(0, 12);
}

function resolveRelativeSpecifier(specifier: string, sourceFilePath: string, repoRoot: string): string {
    const sourceDir = path.dirname(sourceFilePath);
    const resolved = path.resolve(sourceDir, specifier);
    return path.relative(repoRoot, resolved).replace(/\\/g, '/');
}

export function resolveMockModuleKey(
    rawSpecifier: string,
    sourceFilePath: string,
    repoRoot: string,
    options: ResolveMockModuleKeyOptions = {}
): { groupKey: string; specifierKind: 'package' | 'resolved-path' } {
    const specifier = unquoteStringLiteral(rawSpecifier);

    if (specifier.startsWith('.')) {
        return {
            groupKey: resolveRelativeSpecifier(specifier, sourceFilePath, repoRoot),
            specifierKind: 'resolved-path',
        };
    }

    if (specifier.startsWith('@repo/')) {
        return { groupKey: specifier, specifierKind: 'package' };
    }

    const scanPaths = options.scanPaths ?? DEFAULT_SCAN_PATHS;
    const repoRelativeSource = path.relative(repoRoot, sourceFilePath).replace(/\\/g, '/');
    const roots = deriveScanRootsFromScanPaths(scanPaths);
    const scanRoot = findScanRoot(repoRelativeSource, roots);

    if (scanRoot !== null) {
        const pathAliasesByRoot = getPathAliases(repoRoot, scanPaths, options.pathAliases);
        const resolved = resolvePathAlias(specifier, scanRoot, pathAliasesByRoot);
        if (resolved) {
            return { groupKey: resolved, specifierKind: 'resolved-path' };
        }
    }

    return { groupKey: specifier, specifierKind: 'package' };
}

function isMockCall(expressionText: string): boolean {
    return expressionText === 'vi.mock' || expressionText === 'jest.mock';
}

function collectMockOccurrences(
    sourceFile: SourceFile,
    delegatePatterns: readonly RegExp[]
): (MockOccurrence & { factoryText: string | null })[] {
    const occurrences: (MockOccurrence & { factoryText: string | null })[] = [];
    const filePath = sourceFile.getFilePath();

    for (const call of sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression)) {
        const expressionText = call.getExpression().getText();
        if (!isMockCall(expressionText)) {
            continue;
        }

        const args = call.getArguments();
        if (args.length === 0) {
            continue;
        }

        const rawSpecifier = args[0]?.getText() ?? '';
        const factoryArg = args[1];
        const factoryText = factoryArg ? factoryArg.getText() : null;
        const fullMockText = call.getText();
        const lineCount = fullMockText.split('\n').length;

        occurrences.push({
            filePath,
            line: call.getStartLineNumber(),
            lineCount,
            factoryHash: hashFactoryBody(factoryText),
            rawSpecifier,
            delegatesToHelper: factoryDelegatesToHelper(factoryText, delegatePatterns),
            factoryText,
        });
    }

    return occurrences;
}

interface RawModuleGroup {
    groupKey: string;
    specifierKind: 'package' | 'resolved-path';
    occurrences: (MockOccurrence & { factoryText: string | null })[];
    maxLineCount: number;
}

function computeGroupStatusFromFactories(
    occurrences: (MockOccurrence & { factoryText: string | null })[],
    similarityThreshold: number
): { status: MockGroupStatus; identical: boolean; topSimilarPair?: TopSimilarPair } {
    if (occurrences.length < 2) {
        return { status: 'divergent', identical: false };
    }

    const stripped = occurrences.map(({ factoryText: _factoryText, ...occurrence }) => occurrence);
    const hashes = new Set(stripped.map((occurrence) => occurrence.factoryHash ?? '__none__'));
    if (hashes.size === 1) {
        return { status: 'identical', identical: true };
    }

    let topScore = 0;
    let topSimilarPair: TopSimilarPair | undefined;

    for (let leftIndex = 0; leftIndex < occurrences.length; leftIndex += 1) {
        for (let rightIndex = leftIndex + 1; rightIndex < occurrences.length; rightIndex += 1) {
            const left = occurrences[leftIndex];
            const right = occurrences[rightIndex];
            if (!left || !right || !left.factoryText || !right.factoryText) {
                continue;
            }

            const score = factoryJaccardSimilarity(left.factoryText, right.factoryText);
            if (score > topScore) {
                topScore = score;
                topSimilarPair = {
                    left: { filePath: left.filePath, line: left.line },
                    right: { filePath: right.filePath, line: right.line },
                    score,
                };
            }
        }
    }

    const status: MockGroupStatus = topScore >= similarityThreshold ? 'near-duplicate' : 'divergent';
    return { status, identical: false, topSimilarPair };
}

function groupOccurrences(
    allOccurrences: (MockOccurrence & {
        factoryText: string | null;
        groupKey: string;
        specifierKind: 'package' | 'resolved-path';
    })[],
    minOccurrences: number,
    minLines: number,
    similarityThreshold: number
): Pick<AnalyzeTestMocksResult, 'groups' | 'alreadyUsingHelpers'> {
    const byKey = new Map<string, RawModuleGroup>();

    for (const occurrence of allOccurrences) {
        if (occurrence.lineCount < minLines) {
            continue;
        }

        const existing = byKey.get(occurrence.groupKey);
        if (!existing) {
            byKey.set(occurrence.groupKey, {
                groupKey: occurrence.groupKey,
                specifierKind: occurrence.specifierKind,
                occurrences: [occurrence],
                maxLineCount: occurrence.lineCount,
            });
            continue;
        }

        existing.occurrences.push(occurrence);
        existing.maxLineCount = Math.max(existing.maxLineCount, occurrence.lineCount);
    }

    const groups: MockModuleGroup[] = [];
    const alreadyUsingHelpers: AlreadyUsingHelperGroup[] = [];

    for (const rawGroup of byKey.values()) {
        if (rawGroup.occurrences.length < minOccurrences) {
            continue;
        }

        const occurrences = rawGroup.occurrences.map(({ factoryText: _factoryText, ...occurrence }) => occurrence);
        const nonDelegatingOccurrences = occurrences.filter((occurrence) => !occurrence.delegatesToHelper);
        const delegatingOccurrences = occurrences.filter((occurrence) => occurrence.delegatesToHelper);

        if (nonDelegatingOccurrences.length < minOccurrences) {
            alreadyUsingHelpers.push({
                groupKey: rawGroup.groupKey,
                specifierKind: rawGroup.specifierKind,
                delegatingOccurrences,
                allOccurrences: occurrences,
            });
            continue;
        }

        const nonDelegatingWithFactory = rawGroup.occurrences.filter((occurrence) => !occurrence.delegatesToHelper);
        const { status, identical, topSimilarPair } = computeGroupStatusFromFactories(
            nonDelegatingWithFactory,
            similarityThreshold
        );

        groups.push({
            groupKey: rawGroup.groupKey,
            specifierKind: rawGroup.specifierKind,
            occurrences,
            nonDelegatingOccurrences,
            identical,
            status,
            maxLineCount: rawGroup.maxLineCount,
            topSimilarPair,
        });
    }

    const sortGroups = <
        T extends { groupKey: string; allOccurrences?: MockOccurrence[]; occurrences?: MockOccurrence[] },
    >(
        left: T,
        right: T
    ): number => {
        const leftCount = left.allOccurrences?.length ?? left.occurrences?.length ?? 0;
        const rightCount = right.allOccurrences?.length ?? right.occurrences?.length ?? 0;
        if (rightCount !== leftCount) {
            return rightCount - leftCount;
        }

        return left.groupKey.localeCompare(right.groupKey);
    };

    return {
        groups: groups.sort(sortGroups),
        alreadyUsingHelpers: alreadyUsingHelpers.sort(sortGroups),
    };
}

export function listTestFiles(
    repoRoot: string,
    scanPaths: readonly string[],
    options?: { ignoreDirectories?: string[] }
): string[] {
    const files: string[] = [];
    const ignoreDirectories = options?.ignoreDirectories ?? DEFAULT_IGNORE_DIRECTORIES;

    for (const scanPath of scanPaths) {
        const absoluteScanPath = path.join(repoRoot, scanPath);
        if (!fs.existsSync(absoluteScanPath)) {
            continue;
        }

        walkDirectory(
            absoluteScanPath,
            (filePath) => {
                if (/\.(test|spec)\.(ts|tsx)$/.test(filePath)) {
                    files.push(filePath);
                }
            },
            { ignoreDirectories }
        );
    }

    return files;
}

export function analyzeTestMocks(options: AnalyzeTestMocksOptions): AnalyzeTestMocksResult {
    const scanPaths = options.scanPaths ?? DEFAULT_SCAN_PATHS;
    const minOccurrences = options.minOccurrences ?? 2;
    const minLines = options.minLines ?? 8;
    const similarityThreshold = options.similarityThreshold ?? DEFAULT_SIMILARITY_THRESHOLD;
    const delegatePatterns = options.delegatePatterns ?? DEFAULT_DELEGATE_PATTERNS;
    const ignoreDirectories = options.ignoreDirectories ?? DEFAULT_IGNORE_DIRECTORIES;
    const testFiles = listTestFiles(options.repoRoot, scanPaths, { ignoreDirectories });

    const project = new Project({
        skipAddingFilesFromTsConfig: true,
        compilerOptions: {
            allowJs: true,
        },
    });

    const sourceFiles = project.addSourceFilesAtPaths(testFiles);
    const taggedOccurrences: (MockOccurrence & {
        factoryText: string | null;
        groupKey: string;
        specifierKind: 'package' | 'resolved-path';
    })[] = [];

    for (const sourceFile of sourceFiles) {
        for (const occurrence of collectMockOccurrences(sourceFile, delegatePatterns)) {
            const { groupKey, specifierKind } = resolveMockModuleKey(
                occurrence.rawSpecifier,
                occurrence.filePath,
                options.repoRoot,
                { scanPaths, pathAliases: options.pathAliases }
            );
            taggedOccurrences.push({ ...occurrence, groupKey, specifierKind });
        }
    }

    const { groups, alreadyUsingHelpers } = groupOccurrences(
        taggedOccurrences,
        minOccurrences,
        minLines,
        similarityThreshold
    );

    return {
        groups,
        alreadyUsingHelpers,
        scannedFiles: sourceFiles.length,
    };
}
