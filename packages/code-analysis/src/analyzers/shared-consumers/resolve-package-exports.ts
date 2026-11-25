export type PackageExportsField = Record<string, string | Record<string, string>>;

function resolveExportTarget(target: string | Record<string, string>): string | null {
    if (typeof target === 'string') {
        return target;
    }
    return target.import ?? target.default ?? target.types ?? null;
}

/**
 * Resolve a subpath such as `./properties` against a package `exports` map.
 * Exact keys win; otherwise the longest single-`*` prefix match is used.
 */
export function resolveExportSubpath(exportsField: PackageExportsField, subpath: string): string | null {
    const exact = exportsField[subpath];
    if (exact !== undefined) {
        return resolveExportTarget(exact);
    }

    let best: { prefixLength: number; resolved: string } | null = null;
    for (const [key, target] of Object.entries(exportsField)) {
        const star = key.indexOf('*');
        if (star === -1 || key.indexOf('*', star + 1) !== -1) {
            continue;
        }
        const prefix = key.slice(0, star);
        const suffix = key.slice(star + 1);
        if (!subpath.startsWith(prefix) || !subpath.endsWith(suffix)) {
            continue;
        }
        const matchedLength = subpath.length - prefix.length - suffix.length;
        if (matchedLength < 0) {
            continue;
        }
        const matched = subpath.slice(prefix.length, prefix.length + matchedLength);
        const resolvedTarget = resolveExportTarget(target);
        if (resolvedTarget === null) {
            continue;
        }
        const resolved = resolvedTarget.replaceAll('*', matched);
        if (!best || prefix.length > best.prefixLength) {
            best = { prefixLength: prefix.length, resolved };
        }
    }
    return best?.resolved ?? null;
}
