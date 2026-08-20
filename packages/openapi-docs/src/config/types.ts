import type { OperationInfo, SecurityRequirement } from '../openapi/types.js';

export type OpenApiDocsOutput = 'markdown' | 'json' | 'html';

export interface AuthPaths {
    login?: string[];
    refresh?: string[];
    logout?: string[];
}

export interface PostmanOptions {
    output?: string;
    /** Collection variable used as the request host. Required for Postman generation. */
    baseUrlVar?: string;
    baseUrlDefault?: string;
    accessTokenVar?: string;
    refreshTokenVar?: string;
    apiKeyVar?: string;
    testLoginEmailVar?: string;
    testLoginPasswordVar?: string;
    testLoginEmailDefault?: string;
    testLoginPasswordDefault?: string;
    folderStrategy?: 'paths' | 'tags';
    enableSecurityHeuristics?: boolean;
    includeExamples?: boolean;
    groupRootRoutes?: boolean;
    groupAdminRoutes?: boolean;
    adminTag?: string;
    authPaths?: AuthPaths;
    /** Dot path into `pm.response.json()`, e.g. `data.tokens.accessToken`. */
    accessTokenJsonPath?: string;
    refreshTokenJsonPath?: string;
}

export interface OpenApiDocsConfig {
    document: string;
    outDir?: string;
    basename?: string;
    outputs?: OpenApiDocsOutput[];
    viewerTitle?: string;
    apiKeyHeaderName?: string;
    resolveAuthLabel?: (op: OperationInfo, security: SecurityRequirement) => string;
    resolvePermissions?: (op: OperationInfo) => string[];
    describe?: (op: OperationInfo) => string | undefined;
    footnotes?: string[];
    formatMarkdown?: (markdown: string) => string;
    postman?: PostmanOptions;
}

export interface ResolvedPostmanOptions {
    output: string;
    baseUrlVar: string;
    baseUrlDefault: string;
    accessTokenVar: string;
    refreshTokenVar: string;
    apiKeyVar: string;
    testLoginEmailVar: string;
    testLoginPasswordVar: string;
    testLoginEmailDefault: string;
    testLoginPasswordDefault: string;
    folderStrategy: 'paths' | 'tags';
    enableSecurityHeuristics: boolean;
    includeExamples: boolean;
    groupRootRoutes: boolean;
    groupAdminRoutes: boolean;
    adminTag: string;
    authPaths: Required<AuthPaths>;
    accessTokenJsonPath: string;
    refreshTokenJsonPath: string;
}

export interface ResolvedOpenApiDocsConfig {
    document: string;
    outDir: string;
    basename: string;
    outputs: OpenApiDocsOutput[];
    viewerTitle: string;
    apiKeyHeaderName: string;
    resolveAuthLabel: (op: OperationInfo, security: SecurityRequirement) => string;
    resolvePermissions: (op: OperationInfo) => string[];
    describe: (op: OperationInfo) => string | undefined;
    footnotes: string[];
    formatMarkdown: (markdown: string) => string;
    postman: ResolvedPostmanOptions;
}
