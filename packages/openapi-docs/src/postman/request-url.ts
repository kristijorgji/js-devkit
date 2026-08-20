import { isVersionedApiPath, normalizePath } from '../openapi/paths.js';
import type { ResolvedPostmanOptions } from '../config/types.js';
import type { PostmanItem, PostmanRequest, PostmanUrl } from './types.js';

export function getPathFromItem(item: PostmanItem): string {
    const parts = item.request?.url?.path;
    if (!Array.isArray(parts)) return '/';
    return normalizePath(parts.join('/'));
}

export function normalizeRequestUrl(
    request: PostmanRequest | undefined,
    serverBasePath: string[],
    baseUrlVar: string,
): void {
    const url: PostmanUrl | undefined = request?.url;
    if (!url) return;
    url.host = [`{{${baseUrlVar}}}`];
    const currentPath = Array.isArray(url.path) ? url.path : [];
    if (serverBasePath.length === 0 || currentPath.length === 0 || isVersionedApiPath(currentPath)) {
        return;
    }
    url.path = [...serverBasePath, ...currentPath];
}

function matchesAuthPath(path: string[] | undefined, suffixes: string[]): boolean {
    if (!Array.isArray(path) || suffixes.length === 0) return false;
    const joinedPath = path.join('/');
    return suffixes.some((suffix) => {
        const normalized = suffix.replace(/^\/+|\/+$/g, '');
        return (
            joinedPath === `api/v1/auth/${normalized}` ||
            joinedPath === `v1/auth/${normalized}` ||
            joinedPath === `auth/${normalized}` ||
            joinedPath === normalized ||
            joinedPath.endsWith(`/${normalized}`)
        );
    });
}

export function isAuthRequest(item: PostmanItem, suffixes: string[]): boolean {
    return matchesAuthPath(item.request?.url?.path, suffixes);
}

export function applyLoginRequestBodyTemplate(
    request: PostmanRequest | undefined,
    vars: Pick<ResolvedPostmanOptions, 'testLoginEmailVar' | 'testLoginPasswordVar'>,
): void {
    if (!request) return;
    request.body = {
        mode: 'raw',
        raw: JSON.stringify(
            {
                email: `{{${vars.testLoginEmailVar}}}`,
                password: `{{${vars.testLoginPasswordVar}}}`,
            },
            null,
            2,
        ),
        options: {
            raw: {
                language: 'json',
            },
        },
    };
}
