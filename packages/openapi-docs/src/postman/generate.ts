import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

import Converter from 'openapi-to-postmanv2';

import type { ResolvedOpenApiDocsConfig } from '../config/types.js';
import { loadOpenApiDocument } from '../openapi/load-document.js';
import { buildOperationMetadataIndex } from '../openapi/metadata-index.js';
import { getServerBasePathSegments, toOpenApiRelativePath } from '../openapi/paths.js';
import { buildOperationSecurityIndex } from '../openapi/security-index.js';
import type { OpenApiDocument, SecurityRequirement } from '../openapi/types.js';

import { addOrReplaceEvent, ensureVariable, stripRequestExamples, walkItems } from './events.js';
import { flattenApiFolder, groupAdminTaggedRequests, groupPathVersionFolders, groupUnversionedRequests } from './folders.js';
import { applyLoginRequestBodyTemplate, getPathFromItem, isAuthRequest, normalizeRequestUrl } from './request-url.js';
import {
    buildAuthTokenPersistenceTestScript,
    buildLogoutTestScript,
    buildRequestPreRequestScript,
    inferSecurityFromStatusCodes,
} from './scripts.js';
import type { ConversionResult, PostmanCollection, PostmanVariable } from './types.js';

async function convertOpenApiToCollection(
    openApi: string,
    folderStrategy: 'paths' | 'tags',
): Promise<ConversionResult> {
    return new Promise((resolve, reject) => {
        Converter.convert(
            { type: 'string', data: openApi },
            {
                folderStrategy: folderStrategy === 'paths' ? 'Paths' : 'Tags',
                requestNameSource: 'Fallback',
            },
            (error: unknown, result: unknown) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve((result ?? {}) as ConversionResult);
            },
        );
    });
}

export async function generatePostmanCollection(
    config: ResolvedOpenApiDocsConfig,
    openApiDoc: OpenApiDocument = loadOpenApiDocument(config.document),
): Promise<PostmanCollection> {
    const conversion = await convertOpenApiToCollection(JSON.stringify(openApiDoc), config.postman.folderStrategy);

    if (!conversion.result) {
        throw new Error('OpenAPI to Postman conversion failed.');
    }

    const collection: PostmanCollection | undefined = conversion.output?.[0]?.data;
    if (!collection) {
        throw new Error('OpenAPI conversion did not return a Postman collection.');
    }

    const postman = config.postman;
    const currentVariables: PostmanVariable[] = collection.variable ?? [];
    collection.variable = currentVariables.filter((variable) => variable.key !== 'baseUrl');
    ensureVariable(collection.variable, postman.baseUrlVar, postman.baseUrlDefault);
    ensureVariable(collection.variable, postman.accessTokenVar, '');
    ensureVariable(collection.variable, postman.refreshTokenVar, '');
    ensureVariable(collection.variable, postman.apiKeyVar, '');
    ensureVariable(collection.variable, postman.testLoginEmailVar, postman.testLoginEmailDefault);
    ensureVariable(collection.variable, postman.testLoginPasswordVar, postman.testLoginPasswordDefault);
    collection.event = (collection.event ?? []).filter((event) => event.listen !== 'prerequest');
    groupPathVersionFolders(collection.item);
    flattenApiFolder(collection.item);

    const serverBasePath = getServerBasePathSegments(openApiDoc.servers?.[0]?.url);
    const metadataIndex = buildOperationMetadataIndex(openApiDoc, serverBasePath);

    if (postman.groupRootRoutes) {
        groupUnversionedRequests(collection.item, metadataIndex, { serverBasePath });
    }

    if (postman.groupAdminRoutes) {
        groupAdminTaggedRequests(collection.item, metadataIndex, {
            adminTag: postman.adminTag,
            serverBasePath,
        });
    }

    const securityIndex = buildOperationSecurityIndex(openApiDoc, serverBasePath, {
        apiKeyHeaderName: config.apiKeyHeaderName,
    });
    const loginTestScript = buildAuthTokenPersistenceTestScript(postman);
    const refreshTestScript = buildAuthTokenPersistenceTestScript(postman);
    const logoutTestScript = buildLogoutTestScript(postman);
    if (!postman.includeExamples) {
        stripRequestExamples(collection.item);
    }

    walkItems(collection.item, (item) => {
        normalizeRequestUrl(item.request, serverBasePath, postman.baseUrlVar);
        const method = (item.request?.method ?? 'GET').toUpperCase();
        const path = toOpenApiRelativePath(getPathFromItem(item), serverBasePath);
        const key = `${method} ${path}`;
        const openApiSecurity = securityIndex.get(key);
        const security: SecurityRequirement =
            openApiSecurity ??
            (postman.enableSecurityHeuristics
                ? inferSecurityFromStatusCodes(item)
                : { bearer: false, apiKey: false, source: 'none' });
        const preRequestScript = buildRequestPreRequestScript(security, {
            accessTokenVar: postman.accessTokenVar,
            apiKeyVar: postman.apiKeyVar,
            apiKeyHeaderName: config.apiKeyHeaderName,
        });
        if (preRequestScript.length > 0) {
            addOrReplaceEvent(item, 'prerequest', preRequestScript);
        }

        if (isAuthRequest(item, postman.authPaths.login)) {
            applyLoginRequestBodyTemplate(item.request, postman);
            addOrReplaceEvent(item, 'test', loginTestScript);
            return;
        }

        if (isAuthRequest(item, postman.authPaths.refresh)) {
            addOrReplaceEvent(item, 'test', refreshTestScript);
            return;
        }

        if (isAuthRequest(item, postman.authPaths.logout)) {
            addOrReplaceEvent(item, 'test', logoutTestScript);
        }
    });

    return collection;
}

export async function writePostmanCollection(config: ResolvedOpenApiDocsConfig): Promise<string> {
    const collection = await generatePostmanCollection(config);
    mkdirSync(dirname(config.postman.output), { recursive: true });
    writeFileSync(config.postman.output, `${JSON.stringify(collection, null, 2)}\n`);
    return config.postman.output;
}
