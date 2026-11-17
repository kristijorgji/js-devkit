import { classifyUrl, type RouteMatcher } from './classify-route.js';

export function interleaveSeedsByRoute(
    urls: readonly string[],
    matchers: readonly RouteMatcher[],
    maxUrls: number,
    supportedLocales: readonly string[],
): string[] {
    const buckets = new Map<string, string[]>();
    const routeOrder: string[] = [];
    for (const url of urls) {
        const routeName = classifyUrl(url, matchers, supportedLocales).routeName;
        let bucket = buckets.get(routeName);
        if (!bucket) {
            bucket = [];
            buckets.set(routeName, bucket);
            routeOrder.push(routeName);
        }
        bucket.push(url);
    }

    const cursor = new Map<string, number>(routeOrder.map((routeName) => [routeName, 0]));
    const result: string[] = [];
    while (result.length < maxUrls) {
        let added = false;
        for (const routeName of routeOrder) {
            if (result.length >= maxUrls) {
                break;
            }
            const bucket = buckets.get(routeName) ?? [];
            const index = cursor.get(routeName) ?? 0;
            const next = bucket[index];
            if (next === undefined) {
                continue;
            }
            result.push(next);
            cursor.set(routeName, index + 1);
            added = true;
        }
        if (!added) {
            break;
        }
    }
    return result;
}
