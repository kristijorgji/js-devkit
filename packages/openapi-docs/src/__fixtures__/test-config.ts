import { fileURLToPath } from 'node:url';

import { resolveOpenApiDocsConfig } from '../config/load-config.js';

export const FIXTURE_DOCUMENT = fileURLToPath(new URL('./openapi.json', import.meta.url));

export function fixtureConfig(
    overrides: Omit<Parameters<typeof resolveOpenApiDocsConfig>[0], 'document'> & { document?: string } = {},
) {
    return resolveOpenApiDocsConfig({
        viewerTitle: 'API routes',
        ...overrides,
        document: overrides.document ?? FIXTURE_DOCUMENT,
    });
}
