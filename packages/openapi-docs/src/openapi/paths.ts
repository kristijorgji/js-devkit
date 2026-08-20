export function normalizePath(path: string): string {
    if (path.length === 0) return '/';
    const withLeadingSlash = path.startsWith('/') ? path : `/${path}`;
    return withLeadingSlash.replace(/:([A-Za-z0-9_]+)/g, '{$1}');
}

/** Maps OpenAPI `{id}` segments to docs table style (`:id`). */
export function toDisplayPath(path: string): string {
    return path.replace(/\{([A-Za-z0-9_]+)\}/g, ':$1');
}

export function normalizePathForCompare(path: string): string {
    const withLeading = path.startsWith('/') ? path : `/${path}`;
    return withLeading.replace(/:([A-Za-z0-9_]+)/g, '{$1}');
}

export function routeKey(method: string, path: string): string {
    return `${method.toUpperCase()} ${normalizePathForCompare(path)}`;
}

function splitPathSegments(value: string): string[] {
    return value
        .split('/')
        .map((segment) => segment.trim())
        .filter((segment) => segment.length > 0);
}

/**
 * Server URLs often look like `{{baseApiUrl}}/api/v1`. The segment after `}` is
 * the path prefix to strip from OpenAPI keys and Postman request URLs.
 */
export function getServerBasePathSegments(serverUrl: string | undefined): string[] {
    if (!serverUrl) return [];
    const [, remainder = ''] = serverUrl.split('}');
    return splitPathSegments(remainder);
}

function isVersionedApiPath(path: string[]): boolean {
    if (path.length < 2) return false;
    return path[0] === 'api' && /^v\d+$/i.test(path[1] ?? '');
}

/** Strip `api/v1` (or the configured server base) so Postman paths align with OpenAPI path keys. */
export function toOpenApiRelativePath(fullPath: string, serverBasePath: string[]): string {
    const parts = fullPath.split('/').filter(Boolean);
    if (parts.length === 0) return '/';

    if (serverBasePath.length > 0) {
        const base = serverBasePath.join('/');
        const joined = parts.join('/');
        if (joined === base) return '/';
        if (joined.startsWith(`${base}/`)) {
            return normalizePath(joined.slice(base.length));
        }
    }

    if (parts[0] === 'api' && parts.length >= 2 && /^v\d+$/i.test(parts[1] ?? '')) {
        return normalizePath(parts.slice(2).join('/'));
    }

    if (/^v\d+$/i.test(parts[0] ?? '')) {
        return normalizePath(parts.slice(1).join('/'));
    }

    return normalizePath(parts.join('/'));
}

export { isVersionedApiPath };
