import { checkFailed, checkPassed, type SeoCheckResult } from './types.js';

export function checkNotFoundStatus(path: string, status: number): SeoCheckResult {
    if (status === 404) {
        return checkPassed(`not-found:${path}`);
    }
    return checkFailed(`not-found:${path}`, [`${path} returned HTTP ${status} (expected 404)`]);
}

export async function probeNotFoundPages(
    baseUrl: string,
    paths: readonly string[],
    fetchImpl: typeof fetch = fetch,
): Promise<SeoCheckResult[]> {
    const results: SeoCheckResult[] = [];
    for (const path of paths) {
        const response = await fetchImpl(`${baseUrl}${path}`, { redirect: 'manual' });
        results.push(checkNotFoundStatus(path, response.status));
    }
    return results;
}
