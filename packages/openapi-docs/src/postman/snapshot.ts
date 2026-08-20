import { walkItems } from './events.js';
import type { PostmanCollection, PostmanItem, PostmanVariable } from './types.js';

export interface NormalizedPostmanRequest {
    method: string;
    path: string;
    prerequest: string[];
    test: string[];
}

export interface NormalizedPostmanCollection {
    variables: { key: string; value: string }[];
    requests: NormalizedPostmanRequest[];
}

function readScriptLines(item: PostmanItem, listen: 'prerequest' | 'test'): string[] {
    const event = item.event?.find((entry) => entry.listen === listen);
    return [...(event?.script?.exec ?? [])];
}

function normalizeVariables(variables: PostmanVariable[] | undefined): { key: string; value: string }[] {
    return [...(variables ?? [])]
        .map((variable) => ({ key: variable.key, value: variable.value ?? '' }))
        .sort((a, b) => a.key.localeCompare(b.key));
}

/** Stable shape for golden-file comparison (strips Postman ids, descriptions, examples). */
export function normalizePostmanCollection(collection: PostmanCollection): NormalizedPostmanCollection {
    const requests: NormalizedPostmanRequest[] = [];

    walkItems(collection.item, (item) => {
        const method = (item.request?.method ?? 'GET').toUpperCase();
        const path = (item.request?.url?.path ?? []).join('/');
        requests.push({
            method,
            path,
            prerequest: readScriptLines(item, 'prerequest'),
            test: readScriptLines(item, 'test'),
        });
    });

    requests.sort((a, b) => {
        const pathCompare = a.path.localeCompare(b.path);
        if (pathCompare !== 0) return pathCompare;
        return a.method.localeCompare(b.method);
    });

    return {
        variables: normalizeVariables(collection.variable),
        requests,
    };
}
