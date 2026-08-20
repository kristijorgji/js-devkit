import { forEachOpenApiOperation } from './for-each-operation.js';
import type { OpenApiDocument, OpenApiSecurityScheme, SecurityRequirement } from './types.js';

function readOperationSecurity(operation: unknown): Record<string, string[]>[] | undefined {
    if (!operation || typeof operation !== 'object') return undefined;
    const security = (operation as { security?: unknown }).security;
    return Array.isArray(security) ? (security as Record<string, string[]>[]) : undefined;
}

function resolveSecurityRequirement(
    operation: unknown,
    rootSecurity: Record<string, string[]>[] | undefined,
    schemes: Record<string, OpenApiSecurityScheme>,
    apiKeyHeaderName: string,
): SecurityRequirement {
    const operationSecurity = readOperationSecurity(operation);
    const effectiveSecurity = operationSecurity ?? rootSecurity;
    const hasExplicitNoSecurity = Array.isArray(operationSecurity) && operationSecurity.length === 0;
    let bearer = false;
    let apiKey = false;

    if (!hasExplicitNoSecurity && Array.isArray(effectiveSecurity)) {
        for (const securityEntry of effectiveSecurity) {
            for (const schemeName of Object.keys(securityEntry)) {
                const scheme = schemes[schemeName];
                const isBearerByScheme =
                    schemeName === 'bearerAuth' || (scheme?.type === 'http' && scheme?.scheme === 'bearer');
                const isApiKeyByScheme =
                    schemeName === 'apiKeyAuth' ||
                    (scheme?.type === 'apiKey' && scheme?.in === 'header' && scheme?.name === apiKeyHeaderName);

                if (isBearerByScheme) bearer = true;
                if (isApiKeyByScheme) apiKey = true;
            }
        }
    }

    if (hasExplicitNoSecurity || (!bearer && !apiKey)) {
        return { bearer: false, apiKey: false, source: 'none' };
    }

    return { bearer, apiKey, source: 'openapi' };
}

export function buildOperationSecurityIndex(
    openApiDoc: OpenApiDocument,
    serverBasePath: string[] = [],
    options: { apiKeyHeaderName: string },
): Map<string, SecurityRequirement> {
    const index = new Map<string, SecurityRequirement>();
    const schemes = openApiDoc.components?.securitySchemes ?? {};
    const rootSecurity = openApiDoc.security;

    forEachOpenApiOperation(openApiDoc, serverBasePath, ({ key, operation }) => {
        index.set(key, resolveSecurityRequirement(operation, rootSecurity, schemes, options.apiKeyHeaderName));
    });

    return index;
}

export function defaultAuthLabel(security: SecurityRequirement): string {
    if (!security.bearer && !security.apiKey) return 'No';
    if (security.bearer && security.apiKey) return 'JWT or API key';
    if (security.bearer) return 'JWT';
    if (security.apiKey) return 'API key';
    return 'No';
}
