import type {
    OpenApiDocument,
    OpenApiOperationObject,
    OpenApiServer,
    OpenApiSourceSpec,
    OpenApiTag,
} from '../types.js';

function normalizeCombinedServer(server: OpenApiServer): OpenApiServer {
    const normalized = structuredClone(server);
    const rawUrl = normalized.url;
    if (typeof rawUrl !== 'string' || rawUrl.length === 0) return normalized;

    if (rawUrl.includes('}')) {
        const [prefix] = rawUrl.split('}');
        normalized.url = `${prefix}}`;
        return normalized;
    }

    normalized.url = rawUrl.replace(/\/api\/v\d+$/i, '');
    return normalized;
}

function stable(value: unknown): unknown {
    if (Array.isArray(value)) return value.map((entry) => stable(entry));
    if (value && typeof value === 'object') {
        const sortedEntries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b));
        const result: Record<string, unknown> = {};
        for (const [key, child] of sortedEntries) {
            result[key] = stable(child);
        }
        return result;
    }
    return value;
}

function deepEqual(a: unknown, b: unknown): boolean {
    return JSON.stringify(stable(a)) === JSON.stringify(stable(b));
}

function normalizePath(path: string): string {
    if (!path.startsWith('/')) return `/${path}`;
    return path;
}

export function extractVersionPrefix(serverUrl: string | undefined, sourceName: string): string {
    if (!serverUrl) {
        throw new Error(`${sourceName}: missing servers[0].url; cannot derive version prefix.`);
    }
    const [, suffix = ''] = serverUrl.split('}');
    if (!suffix || suffix === '/') {
        return '';
    }
    const normalized = normalizePath(suffix);
    if (!normalized.startsWith('/api/')) {
        throw new Error(`${sourceName}: expected servers[0].url to include /api/<version>, got "${serverUrl}".`);
    }
    return normalized;
}

function mergeComponentSection(
    target: Record<string, unknown>,
    source: Record<string, unknown>,
    sectionName: string,
    sourceName: string,
): void {
    for (const [key, value] of Object.entries(source)) {
        if (!(key in target)) {
            target[key] = value;
            continue;
        }
        if (!deepEqual(target[key], value)) {
            throw new Error(`components.${sectionName}.${key} conflict while merging ${sourceName}.`);
        }
    }
}

export function mergeSpecs(specs: readonly OpenApiSourceSpec[]): OpenApiDocument {
    if (specs.length === 0) throw new Error('No OpenAPI specs provided for merge.');
    const first = specs[0];
    if (!first) throw new Error('No OpenAPI specs provided for merge.');

    const firstServer = first.doc.servers?.[0];
    if (!firstServer) {
        throw new Error(`${first.name}: missing servers[0]; cannot build combined spec.`);
    }

    const merged: OpenApiDocument = {
        openapi: first.doc.openapi,
        info: {
            title: first.doc.info?.title ?? 'API',
            version: 'combined',
            description: 'Combined OpenAPI spec (multi-version) used for Postman generation.',
        },
        servers: [normalizeCombinedServer(firstServer)],
        paths: {},
        components: {},
        tags: [],
    };

    const tagsByName = new Map<string, OpenApiTag>();
    const operationIds = new Set<string>();
    const rootSecurity: OpenApiDocument['security'] | undefined = first.doc.security;
    let isRootSecurityConsistent = true;

    for (const spec of specs) {
        if (!deepEqual(rootSecurity, spec.doc.security)) {
            isRootSecurityConsistent = false;
        }

        for (const [rawPath, pathItem] of Object.entries(spec.doc.paths ?? {})) {
            const mergedPath = `${spec.versionPrefix}${normalizePath(rawPath)}`;
            const mergedPaths = merged.paths ?? (merged.paths = {});
            const existingPath = mergedPaths[mergedPath];
            if (!existingPath) {
                mergedPaths[mergedPath] = {};
            }
            const mergedPathItem = mergedPaths[mergedPath] as Record<string, unknown>;

            for (const [method, methodValue] of Object.entries(pathItem)) {
                const normalizedMethod = method.toLowerCase();
                if (normalizedMethod.startsWith('x-')) {
                    mergedPathItem[method] = methodValue;
                    continue;
                }

                const existingMethod = mergedPathItem[normalizedMethod];
                if (existingMethod && !deepEqual(existingMethod, methodValue)) {
                    throw new Error(`paths.${mergedPath}.${normalizedMethod} conflict while merging ${spec.name}.`);
                }
                if (existingMethod) continue;

                const operation = structuredClone(methodValue) as OpenApiOperationObject;
                if (operation.operationId) {
                    const originalId = operation.operationId;
                    if (operationIds.has(originalId)) {
                        operation.operationId = `${originalId}_${spec.name}`;
                    }
                    operationIds.add(operation.operationId);
                }
                mergedPathItem[normalizedMethod] = operation;
            }
        }

        for (const [sectionName, sectionMap] of Object.entries(spec.doc.components ?? {})) {
            if (!sectionMap) continue;
            const mergedComponents = merged.components ?? (merged.components = {});
            const targetSection = mergedComponents[sectionName] ?? (mergedComponents[sectionName] = {});
            mergeComponentSection(targetSection, sectionMap, sectionName, spec.name);
        }

        for (const tag of spec.doc.tags ?? []) {
            const existing = tagsByName.get(tag.name);
            if (!existing) {
                tagsByName.set(tag.name, tag);
                continue;
            }
            if (!deepEqual(existing, tag)) {
                throw new Error(`tags.${tag.name} conflict while merging ${spec.name}.`);
            }
        }
    }

    merged.tags = [...tagsByName.values()];
    if (isRootSecurityConsistent) {
        merged.security = rootSecurity;
    }
    if (merged.tags.length === 0) {
        delete merged.tags;
    }
    if (Object.keys(merged.components ?? {}).length === 0) {
        delete merged.components;
    }

    return merged;
}
