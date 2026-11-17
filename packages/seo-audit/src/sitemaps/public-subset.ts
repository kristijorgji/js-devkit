import { checkFailed, checkPassed, type SeoCheckResult } from './types.js';

export function checkPublicSubset(publicLocs: string[], secretLocs: string[]): SeoCheckResult {
    const secret = new Set(secretLocs);
    const missing = publicLocs.filter((loc) => !secret.has(loc));
    if (missing.length === 0) {
        return checkPassed('public-subset');
    }
    return checkFailed(
        'public-subset',
        missing.slice(0, 20).map((loc) => `public loc missing from secret sitemap: ${loc}`),
    );
}
