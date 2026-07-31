import fs from 'node:fs';
import path from 'node:path';

export interface PathAlias {
    prefix: string;
    target: string;
}

/** Fallback aliases applied when a scan root has no tsconfig-derived paths. */
export const DEFAULT_PATH_ALIASES: Record<string, string> = {
    '@/': 'src/',
    '@': 'src/',
};

let pathAliasesCache: {
    cacheKey: string;
    aliases: Record<string, PathAlias[]>;
} | null = null;

export function clearPathAliasesCache(): void {
    pathAliasesCache = null;
}

/**
 * Derives the set of "scan roots" (the directory that owns a tsconfig.json)
 * from a list of scan paths. A scan path pointing at `<root>/src` maps to
 * `<root>`; a bare `src` scan path maps to the repo root (represented as `''`).
 */
export function deriveScanRootsFromScanPaths(scanPaths: readonly string[]): string[] {
    const roots = new Set<string>();

    for (const scanPath of scanPaths) {
        const normalized = scanPath.replace(/\/+$/, '');
        if (normalized === 'src') {
            roots.add('');
            continue;
        }

        roots.add(normalized.endsWith('/src') ? normalized.slice(0, -'/src'.length) : normalized);
    }

    return [...roots].sort((left, right) => right.length - left.length);
}

/**
 * Finds the most specific scan root that owns the given repo-relative file
 * path. Roots must be pre-sorted longest-first (see {@link deriveScanRootsFromScanPaths}).
 */
export function findScanRoot(repoRelativeFilePath: string, roots: readonly string[]): string | null {
    for (const root of roots) {
        if (root === '') {
            continue;
        }

        if (repoRelativeFilePath === root || repoRelativeFilePath.startsWith(`${root}/`)) {
            return root;
        }
    }

    return roots.includes('') ? '' : null;
}

function tsconfigPathEntryToAlias(pathKey: string, pathTarget: string): PathAlias | null {
    if (!pathKey.endsWith('/*')) {
        return null;
    }

    const prefix = pathKey.slice(0, -1);
    let target = pathTarget;

    if (target.endsWith('/*')) {
        target = target.slice(0, -2);
    }

    if (target.startsWith('./')) {
        target = target.slice(2);
    }

    if (!target.endsWith('/')) {
        target += '/';
    }

    return { prefix, target };
}

function parseTsconfig(filePath: string): { compilerOptions?: { paths?: Record<string, string[]> } } {
    const raw = fs.readFileSync(filePath, 'utf8');
    const withoutLineComments = raw.replace(/^\s*\/\/.*$/gm, '');
    const withoutTrailingCommas = withoutLineComments.replace(/,(\s*[}\]])/g, '$1');
    return JSON.parse(withoutTrailingCommas) as { compilerOptions?: { paths?: Record<string, string[]> } };
}

export function loadPathAliasesFromTsconfig(repoRoot: string, scanRoot: string): PathAlias[] {
    const tsconfigPath = path.join(repoRoot, scanRoot, 'tsconfig.json');
    if (!fs.existsSync(tsconfigPath)) {
        return [];
    }

    const parsed = parseTsconfig(tsconfigPath);
    const paths = parsed.compilerOptions?.paths ?? {};
    const aliases: PathAlias[] = [];

    for (const [pathKey, targets] of Object.entries(paths)) {
        const target = targets[0];
        if (!target) {
            continue;
        }

        const alias = tsconfigPathEntryToAlias(pathKey, target);
        if (alias) {
            aliases.push(alias);
        }
    }

    return aliases.sort((left, right) => right.prefix.length - left.prefix.length);
}

function defaultAliasesFor(extraAliases?: Record<string, string>): PathAlias[] {
    const merged = { ...DEFAULT_PATH_ALIASES, ...extraAliases };
    return Object.entries(merged)
        .map(([prefix, target]) => ({ prefix, target }))
        .sort((left, right) => right.prefix.length - left.prefix.length);
}

/**
 * Resolves path aliases per scan root, preferring tsconfig-driven `paths`
 * entries and falling back to `{ '@/': 'src/', '@': 'src/' }` (merged with
 * any caller-supplied extra aliases) when a root has no usable tsconfig.
 */
export function getPathAliases(
    repoRoot: string,
    scanPaths: readonly string[],
    extraAliases?: Record<string, string>
): Record<string, PathAlias[]> {
    const cacheKey = `${repoRoot}\0${scanPaths.join('\0')}\0${JSON.stringify(extraAliases ?? {})}`;
    if (pathAliasesCache?.cacheKey === cacheKey) {
        return pathAliasesCache.aliases;
    }

    const aliases: Record<string, PathAlias[]> = {};

    for (const root of deriveScanRootsFromScanPaths(scanPaths)) {
        const fromTsconfig = loadPathAliasesFromTsconfig(repoRoot, root);
        aliases[root] = fromTsconfig.length > 0 ? fromTsconfig : defaultAliasesFor(extraAliases);
    }

    pathAliasesCache = { cacheKey, aliases };
    return aliases;
}

export function resolvePathAlias(
    specifier: string,
    scanRoot: string,
    pathAliasesByRoot: Record<string, PathAlias[]>
): string | null {
    const aliases = pathAliasesByRoot[scanRoot];
    if (!aliases) {
        return null;
    }

    for (const alias of aliases) {
        const bareAlias = alias.prefix.replace(/\/$/, '');
        if (specifier === bareAlias || specifier.startsWith(alias.prefix)) {
            const remainder = specifier.startsWith(alias.prefix) ? specifier.slice(alias.prefix.length) : '';
            const joined = scanRoot ? path.join(scanRoot, alias.target, remainder) : path.join(alias.target, remainder);
            return joined.replace(/\\/g, '/');
        }
    }

    return null;
}
