import { forEachOpenApiOperation } from './for-each-operation.js';
import type { OpenApiDocument, OperationMetadata } from './types.js';

function readOperationTags(operation: unknown): string[] {
    if (!operation || typeof operation !== 'object') return [];
    const tags = (operation as { tags?: unknown }).tags;
    return Array.isArray(tags) ? tags.filter((tag): tag is string => typeof tag === 'string') : [];
}

export function readOperationSummary(operation: unknown): string | undefined {
    if (!operation || typeof operation !== 'object') return undefined;
    const summary = (operation as { summary?: unknown }).summary;
    return typeof summary === 'string' ? summary : undefined;
}

export function buildOperationMetadataIndex(
    openApiDoc: OpenApiDocument,
    serverBasePath: string[] = [],
): Map<string, OperationMetadata> {
    const index = new Map<string, OperationMetadata>();

    forEachOpenApiOperation(openApiDoc, serverBasePath, ({ key, operation }) => {
        index.set(key, {
            tags: readOperationTags(operation),
            summary: readOperationSummary(operation),
        });
    });

    return index;
}
