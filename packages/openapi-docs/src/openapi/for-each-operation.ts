import { normalizePath, toOpenApiRelativePath } from './paths.js';
import type { OpenApiDocument } from './types.js';

export interface OpenApiOperationRef {
    method: string;
    operation: unknown;
    /** Lookup key aligned with Postman requests, e.g. `POST /posts`. */
    key: string;
    rawPath: string;
    relativePath: string;
}

export function forEachOpenApiOperation(
    openApiDoc: OpenApiDocument,
    serverBasePath: string[],
    visitor: (ref: OpenApiOperationRef) => void,
): void {
    const paths = openApiDoc.paths ?? {};

    for (const [rawPath, pathItem] of Object.entries(paths)) {
        const relativePath = toOpenApiRelativePath(normalizePath(rawPath), serverBasePath);

        for (const [method, operation] of Object.entries(pathItem)) {
            if (method === 'parameters') continue;

            visitor({
                method: method.toUpperCase(),
                operation,
                key: `${method.toUpperCase()} ${relativePath}`,
                rawPath,
                relativePath,
            });
        }
    }
}
