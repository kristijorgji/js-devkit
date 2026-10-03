export interface OpenApiTag {
    name: string;
    description?: string;
}

export interface OpenApiSecurityScheme {
    type?: string;
    scheme?: string;
    name?: string;
    in?: string;
}

export interface OpenApiOperationObject {
    operationId?: string;
    security?: Record<string, string[]>[];
    [key: string]: unknown;
}

export type OpenApiPathItemObject = Record<string, OpenApiOperationObject | unknown>;

export interface OpenApiServer {
    url?: string;
    [key: string]: unknown;
}

export interface OpenApiComponents {
    securitySchemes?: Record<string, OpenApiSecurityScheme>;
    [sectionName: string]: Record<string, unknown> | undefined;
}

export interface OpenApiDocument {
    openapi: string;
    info?: Record<string, unknown>;
    servers?: OpenApiServer[];
    paths?: Record<string, OpenApiPathItemObject>;
    components?: OpenApiComponents;
    tags?: OpenApiTag[];
    security?: Record<string, string[]>[];
    [key: string]: unknown;
}

export interface OpenApiSourceSpec {
    name: string;
    versionPrefix: string;
    doc: OpenApiDocument;
}
