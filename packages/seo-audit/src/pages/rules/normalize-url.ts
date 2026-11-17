/** Drop the hash and a trailing slash, keeping a locale-root slash if the URL already has one. */
export function normalizeAuditUrl(raw: string, baseUrl: string, locales: readonly string[]): string | undefined {
    let url: URL;
    let base: URL;
    try {
        url = new URL(raw, baseUrl);
        base = new URL(baseUrl);
    } catch {
        return undefined;
    }
    if (url.origin !== base.origin) {
        return undefined;
    }
    url.hash = '';
    const segments = url.pathname.split('/').filter((segment) => segment.length > 0);
    const localeRoot = segments.length === 1 && locales.includes(segments[0] ?? '');
    if (!localeRoot) {
        url.pathname = segments.length === 0 ? '/' : `/${segments.join('/')}`;
    }
    return url.toString();
}

export function isAbsoluteHttpUrl(raw: string): boolean {
    return /^https?:\/\//i.test(raw);
}
