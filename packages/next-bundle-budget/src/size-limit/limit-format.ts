/** Headroom applied when lowering static caps via sync-limits. */
const SIZE_LIMIT_SYNC_HEADROOM_RATIO = 0.15;

function formatSizeLimit(bytes: number): string {
    if (bytes >= 1024) {
        return `${Math.ceil(bytes / 1024)} KB`;
    }
    return `${bytes} B`;
}

export function suggestedLimitFromMeasuredSize(sizeBytes: number): string {
    const withHeadroom = Math.ceil(sizeBytes * (1 + SIZE_LIMIT_SYNC_HEADROOM_RATIO));
    return formatSizeLimit(withHeadroom);
}

/**
 * Route-owned caps use KB units with a +2 KB floor so sub-10 KB pages
 * are not gated on a few hundred bytes of 15% headroom.
 */
export function suggestedRouteOwnedLimitFromMeasuredSize(sizeBytes: number): string {
    const measuredKb = sizeBytes / 1024;
    const withRatio = Math.ceil(measuredKb * (1 + SIZE_LIMIT_SYNC_HEADROOM_RATIO));
    const withFloor = Math.ceil(measuredKb) + 2;
    return `${Math.max(withRatio, withFloor)} KB`;
}

/** size-limit globs `path`; App Router files contain `[locale]` and `(cached)`. */
export function escapeSizeLimitGlobPath(path: string): string {
    return path.replace(/[[\]()]/gu, (char) => {
        if (char === '[') {
            return '[[]';
        }
        if (char === ']') {
            return '[]]';
        }
        if (char === '(') {
            return '[(]';
        }
        return '[)]';
    });
}

export function unescapeSizeLimitGlobPath(path: string): string {
    return path.replaceAll('[[]', '[').replaceAll('[]]', ']').replaceAll('[(]', '(').replaceAll('[)]', ')');
}

export function parseSizeLimitToBytes(limit: string): number {
    const match = limit.trim().match(/^(\d+(?:\.\d+)?)\s*(B|KB|MB)$/i);
    if (!match) {
        throw new Error(`Invalid size limit: ${limit}`);
    }
    const value = Number(match[1]);
    const unit = match[2]?.toUpperCase();
    if (unit === 'KB') {
        return Math.round(value * 1024);
    }
    if (unit === 'MB') {
        return Math.round(value * 1024 * 1024);
    }
    return Math.round(value);
}
