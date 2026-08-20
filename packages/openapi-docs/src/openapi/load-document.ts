import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import type { OpenApiDocument } from './types.js';

export function loadOpenApiDocument(documentPath: string): OpenApiDocument {
    const resolved = resolve(documentPath);
    if (/\.ya?ml$/i.test(resolved)) {
        throw new Error(`OpenAPI YAML is not supported yet. Convert ${resolved} to JSON.`);
    }
    const raw = readFileSync(resolved, 'utf8');
    return JSON.parse(raw) as OpenApiDocument;
}
