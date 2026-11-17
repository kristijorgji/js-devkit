export interface WebRoutePage {
    routeName: string;
    pathsByLocale: Record<string, string>;
    indexable: string;
}

export interface WebRoutesDocument {
    appPages: WebRoutePage[];
}

export interface RouteMatcher {
    routeName: string;
    locale: string;
    pattern: RegExp;
    staticSegments: number;
    segmentCount: number;
}

function escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

export function parseRoutesDocument(raw: string): WebRoutesDocument {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || !Array.isArray(parsed.appPages)) {
        throw new Error('routes document is missing appPages');
    }
    return { appPages: parsed.appPages.filter(isRoutePage) };
}

function isRoutePage(value: unknown): value is WebRoutePage {
    if (!isRecord(value) || typeof value.routeName !== 'string' || typeof value.indexable !== 'string') {
        return false;
    }
    return isRecord(value.pathsByLocale);
}

export function loadRouteMatchers(routesJson: WebRoutesDocument): RouteMatcher[] {
    const matchers: RouteMatcher[] = [];
    for (const page of routesJson.appPages) {
        for (const [locale, template] of Object.entries(page.pathsByLocale)) {
            if (typeof template !== 'string') {
                continue;
            }
            const segments = template.split('/').filter((segment) => segment.length > 0);
            const source = segments
                .map((segment) => (segment.startsWith('[') && segment.endsWith(']') ? '[^/]+' : escapeRegex(segment)))
                .join('/');
            matchers.push({
                routeName: page.routeName,
                locale,
                pattern: new RegExp(`^/${source}/?$`),
                staticSegments: segments.filter((segment) => !segment.startsWith('[')).length,
                segmentCount: segments.length,
            });
        }
    }
    return matchers;
}

export interface ClassifiedRoute {
    routeName: string;
    locale: string;
}

export function classifyUrl(
    url: string,
    matchers: readonly RouteMatcher[],
    supportedLocales: readonly string[],
): ClassifiedRoute {
    const pathname = new URL(url, 'http://localhost').pathname;
    const firstSegment = pathname.split('/').filter((segment) => segment.length > 0)[0] ?? '';
    const matches = matchers.filter((matcher) => matcher.pattern.test(pathname));
    if (matches.length === 0) {
        return { routeName: 'unknown', locale: firstSegment };
    }
    matches.sort((left, right) => {
        if (right.staticSegments !== left.staticSegments) {
            return right.staticSegments - left.staticSegments;
        }
        return left.segmentCount - right.segmentCount;
    });
    const best = matches[0];
    if (!best) {
        return { routeName: 'unknown', locale: firstSegment };
    }
    const locale = supportedLocales.includes(firstSegment) ? best.locale : firstSegment;
    return { routeName: best.routeName, locale };
}
