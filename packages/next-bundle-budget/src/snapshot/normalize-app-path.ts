function isGroupSegment(segment: string): boolean {
    return segment.startsWith('(') && segment.endsWith(')');
}

/** Mirrors Next.js `normalizeAppPath` for App Router app paths. */
export function normalizeAppPath(appPath: string): string {
    const segments = appPath.split('/').filter(Boolean);
    const routeSegments: string[] = [];

    for (let index = 0; index < segments.length; index += 1) {
        const segment = segments[index];
        if (!segment || isGroupSegment(segment) || segment.startsWith('@')) {
            continue;
        }
        if ((segment === 'page' || segment === 'route') && index === segments.length - 1) {
            continue;
        }
        routeSegments.push(segment);
    }

    return routeSegments.length === 0 ? '/' : `/${routeSegments.join('/')}`;
}
