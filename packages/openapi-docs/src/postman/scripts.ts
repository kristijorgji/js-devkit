import type { ResolvedPostmanOptions } from '../config/types.js';
import type { SecurityRequirement } from '../openapi/types.js';
import type { PostmanItem } from './types.js';

function jsonPathExpression(path: string): string {
    return path
        .split('.')
        .filter(Boolean)
        .reduce((expr, segment) => `${expr}?.${segment}`, 'json');
}

export function buildAuthTokenPersistenceTestScript(config: ResolvedPostmanOptions): string[] {
    return [
        'const json = pm.response.json();',
        `const accessToken = ${jsonPathExpression(config.accessTokenJsonPath)};`,
        `const refreshToken = ${jsonPathExpression(config.refreshTokenJsonPath)};`,
        '',
        'if (accessToken) {',
        `  pm.collectionVariables.set("${config.accessTokenVar}", accessToken);`,
        '}',
        '',
        'if (refreshToken) {',
        `  pm.collectionVariables.set("${config.refreshTokenVar}", refreshToken);`,
        '}',
    ];
}

export function buildLogoutTestScript(config: ResolvedPostmanOptions): string[] {
    return [
        'if (pm.response.code >= 200 && pm.response.code < 300) {',
        `  pm.collectionVariables.unset("${config.accessTokenVar}");`,
        `  pm.collectionVariables.unset("${config.refreshTokenVar}");`,
        `  pm.collectionVariables.unset("${config.apiKeyVar}");`,
        '}',
    ];
}

export function buildRequestPreRequestScript(
    security: SecurityRequirement,
    config: Pick<ResolvedPostmanOptions, 'accessTokenVar' | 'apiKeyVar'> & { apiKeyHeaderName: string },
): string[] {
    const scriptLines: string[] = [];

    if (security.bearer) {
        scriptLines.push(
            `const bearerToken = pm.collectionVariables.get("${config.accessTokenVar}");`,
            'if (bearerToken) {',
            '  pm.request.headers.upsert({',
            '    key: "Authorization",',
            '    value: `Bearer ${bearerToken}`,',
            '  });',
            '}',
        );
    }

    if (security.apiKey) {
        if (scriptLines.length > 0) scriptLines.push('');
        scriptLines.push(
            `const apiKey = pm.collectionVariables.get("${config.apiKeyVar}");`,
            'if (apiKey) {',
            '  pm.request.headers.upsert({',
            `    key: "${config.apiKeyHeaderName}",`,
            '    value: apiKey,',
            '  });',
            '}',
        );
    }

    return scriptLines;
}

/** Generic fallback: a 401/403 example implies bearer auth. No path-prefix policy. */
export function inferSecurityFromStatusCodes(item: PostmanItem): SecurityRequirement {
    const responseCodes = new Set((item.response ?? []).map((response) => response.code).filter(Boolean) as number[]);
    const hasAuthLikeResponse = responseCodes.has(401) || responseCodes.has(403);
    if (!hasAuthLikeResponse) return { bearer: false, apiKey: false, source: 'none' };
    return { bearer: true, apiKey: false, source: 'heuristic' };
}
