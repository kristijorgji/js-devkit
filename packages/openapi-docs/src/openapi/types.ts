export interface OpenApiSecurityScheme {
    type?: string;
    scheme?: string;
    name?: string;
    in?: string;
}

export interface OpenApiServer {
    url?: string;
}

export interface OpenApiDocument {
    openapi: string;
    info?: Record<string, unknown>;
    servers?: OpenApiServer[];
    paths?: Record<string, Record<string, unknown>>;
    components?: {
        securitySchemes?: Record<string, OpenApiSecurityScheme>;
        [sectionName: string]: unknown;
    };
    security?: Record<string, string[]>[];
    [key: string]: unknown;
}

export interface SecurityRequirement {
    bearer: boolean;
    apiKey: boolean;
    source: 'openapi' | 'heuristic' | 'none';
}

export interface OperationInfo {
    method: string;
    /** Display path using `:id` segments. */
    path: string;
    rawPath: string;
    /** Path key used for Postman / OpenAPI lookups after stripping the server base. */
    relativePath: string;
    summary?: string;
    tags: string[];
}

export interface OperationMetadata {
    tags: string[];
    summary?: string;
}
