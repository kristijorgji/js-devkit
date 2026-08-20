import type { ResolvedOpenApiDocsConfig } from '../config/types.js';
import { loadOpenApiDocument } from '../openapi/load-document.js';
import { readOperationSummary } from '../openapi/metadata-index.js';
import { getServerBasePathSegments, normalizePath, toDisplayPath, toOpenApiRelativePath } from '../openapi/paths.js';
import { buildOperationSecurityIndex } from '../openapi/security-index.js';
import type { OpenApiDocument, OperationInfo, SecurityRequirement } from '../openapi/types.js';

export interface RouteCatalogRow {
    method: string;
    path: string;
    authRequired: string;
    permissionsRequired: string;
    description: string;
}

function readOperationTags(operation: unknown): string[] {
    if (!operation || typeof operation !== 'object') return [];
    const tags = (operation as { tags?: unknown }).tags;
    return Array.isArray(tags) ? tags.filter((tag): tag is string => typeof tag === 'string') : [];
}

function formatPermissions(permissions: string[]): string {
    return permissions.length > 0 ? permissions.join(', ') : '-';
}

export function buildRouteCatalog(
    config: ResolvedOpenApiDocsConfig,
    openApiDoc: OpenApiDocument = loadOpenApiDocument(config.document),
): RouteCatalogRow[] {
    const serverBasePath = getServerBasePathSegments(openApiDoc.servers?.[0]?.url);
    const securityIndex = buildOperationSecurityIndex(openApiDoc, serverBasePath, {
        apiKeyHeaderName: config.apiKeyHeaderName,
    });
    const rows: RouteCatalogRow[] = [];

    for (const [rawPath, pathItem] of Object.entries(openApiDoc.paths ?? {})) {
        const normalizedRawPath = normalizePath(rawPath);
        const relativePath = toOpenApiRelativePath(normalizedRawPath, serverBasePath);
        const displayPath = toDisplayPath(normalizedRawPath);

        for (const [method, operation] of Object.entries(pathItem)) {
            if (method === 'parameters') continue;

            const httpMethod = method.toUpperCase();
            const security: SecurityRequirement =
                securityIndex.get(`${httpMethod} ${relativePath}`) ??
                ({ bearer: false, apiKey: false, source: 'none' } as const);
            const op: OperationInfo = {
                method: httpMethod,
                path: displayPath,
                rawPath,
                relativePath,
                summary: readOperationSummary(operation),
                tags: readOperationTags(operation),
            };

            rows.push({
                method: httpMethod,
                path: displayPath,
                authRequired: config.resolveAuthLabel(op, security),
                permissionsRequired: formatPermissions(config.resolvePermissions(op)),
                description: config.describe(op) ?? '-',
            });
        }
    }

    return rows.sort((a, b) => {
        const pathCompare = a.path.localeCompare(b.path);
        if (pathCompare !== 0) return pathCompare;
        return a.method.localeCompare(b.method);
    });
}
