import { getPathFromItem } from './request-url.js';
import type { PostmanItem } from './types.js';
import type { OperationMetadata } from '../openapi/types.js';
import { isVersionedApiPath, toOpenApiRelativePath } from '../openapi/paths.js';

function getVersionSegmentFromPath(path: string[] | undefined): string | undefined {
    if (!Array.isArray(path) || path.length === 0) return undefined;
    if (path[0] === 'api' && path.length >= 2 && /^v\d+$/i.test(path[1] ?? '')) return path[1];
    if (/^v\d+$/i.test(path[0] ?? '')) return path[0];
    return undefined;
}

function createVersionFolder(versionSegment: string): PostmanItem {
    return {
        name: versionSegment,
        item: [],
        event: [],
    };
}

export function groupPathVersionFolders(items: PostmanItem[] | undefined): void {
    if (!Array.isArray(items)) return;

    for (const item of items) {
        groupPathVersionFolders(item.item);
    }

    for (const folder of items) {
        if (!folder.item || folder.name !== 'api') continue;

        const existingVersionFolders = new Map<string, PostmanItem>();
        for (const child of folder.item) {
            if (Array.isArray(child.item) && typeof child.name === 'string' && /^v\d+$/i.test(child.name)) {
                existingVersionFolders.set(child.name, child);
            }
        }

        const retainedChildren: PostmanItem[] = [];

        for (const child of folder.item) {
            if (Array.isArray(child.item)) {
                retainedChildren.push(child);
                continue;
            }

            const versionSegment = getVersionSegmentFromPath(child.request?.url?.path);
            if (!versionSegment) {
                retainedChildren.push(child);
                continue;
            }

            let versionFolder = existingVersionFolders.get(versionSegment);
            if (!versionFolder) {
                versionFolder = createVersionFolder(versionSegment);
                existingVersionFolders.set(versionSegment, versionFolder);
                retainedChildren.push(versionFolder);
            }

            versionFolder.item = [...(versionFolder.item ?? []), child];
        }

        folder.item = retainedChildren;
    }
}

function mergeVersionFolders(items: PostmanItem[]): void {
    const versionMap = new Map<string, PostmanItem>();
    const retained: PostmanItem[] = [];

    for (const item of items) {
        if (typeof item.name === 'string' && /^v\d+$/i.test(item.name) && Array.isArray(item.item)) {
            const existing = versionMap.get(item.name);
            if (existing) {
                existing.item = [...(existing.item ?? []), ...(item.item ?? [])];
            } else {
                versionMap.set(item.name, item);
                retained.push(item);
            }
            continue;
        }
        retained.push(item);
    }

    items.splice(0, items.length, ...retained);
}

/** Hoist `api` folder children to the collection root so folders read `v1` / `v2` instead of `api` / `v1`. */
export function flattenApiFolder(items: PostmanItem[] | undefined): void {
    if (!Array.isArray(items)) return;

    for (const item of items) {
        flattenApiFolder(item.item);
    }

    for (let index = 0; index < items.length; index++) {
        const item = items[index];
        if (!item || item.name !== 'api' || !Array.isArray(item.item)) continue;

        items.splice(index, 1, ...item.item);
        mergeVersionFolders(items);
        flattenApiFolder(items);
        return;
    }
}

interface AdminPlacement {
    version: string;
    domain: string;
    requestName: string;
}

function deriveAdminPlacement(fullPath: string, relativePath: string, summary?: string): AdminPlacement {
    const versionMatch = fullPath.match(/\/(v\d+)\//i);
    const version = versionMatch?.[1] ?? 'v1';
    const segments = relativePath.split('/').filter(Boolean);
    const domain = segments.find((segment) => !segment.startsWith('{')) ?? 'misc';
    const requestName = summary ?? segments.filter((segment) => !segment.startsWith('{')).at(-1) ?? domain;
    return { version, domain, requestName };
}

function findOrCreateFolder(parent: PostmanItem, name: string): PostmanItem {
    parent.item ??= [];
    const existing = parent.item.find((child) => child.name === name && Array.isArray(child.item));
    if (existing) return existing;

    const folder: PostmanItem = { name, item: [] };
    parent.item.push(folder);
    return folder;
}

function extractTaggedRequests(
    items: PostmanItem[] | undefined,
    metadataIndex: Map<string, OperationMetadata>,
    tag: string,
    serverBasePath: string[],
): PostmanItem[] {
    const extracted: PostmanItem[] = [];
    if (!Array.isArray(items)) return extracted;

    for (let index = items.length - 1; index >= 0; index--) {
        const entry = items[index];
        if (!entry) continue;
        if (Array.isArray(entry.item)) {
            extracted.push(...extractTaggedRequests(entry.item, metadataIndex, tag, serverBasePath));
            if (entry.item.length === 0) {
                items.splice(index, 1);
            }
            continue;
        }

        const method = (entry.request?.method ?? 'GET').toUpperCase();
        const relativePath = toOpenApiRelativePath(getPathFromItem(entry), serverBasePath);
        const metadata = metadataIndex.get(`${method} ${relativePath}`);
        if (!metadata?.tags.includes(tag)) continue;

        extracted.push(entry);
        items.splice(index, 1);
    }

    return extracted;
}

function extractUnversionedRequests(items: PostmanItem[] | undefined): PostmanItem[] {
    const extracted: PostmanItem[] = [];
    if (!Array.isArray(items)) return extracted;

    for (let index = items.length - 1; index >= 0; index--) {
        const entry = items[index];
        if (!entry) continue;
        if (Array.isArray(entry.item)) {
            extracted.push(...extractUnversionedRequests(entry.item));
            if (entry.item.length === 0) {
                items.splice(index, 1);
            }
            continue;
        }

        const pathParts = entry.request?.url?.path;
        if (!Array.isArray(pathParts) || isVersionedApiPath(pathParts)) continue;

        extracted.push(entry);
        items.splice(index, 1);
    }

    return extracted;
}

function extractAdminRequests(
    items: PostmanItem[] | undefined,
    metadataIndex: Map<string, OperationMetadata>,
    adminTag: string,
    serverBasePath: string[],
): { item: PostmanItem; placement: AdminPlacement }[] {
    return extractTaggedRequests(items, metadataIndex, adminTag, serverBasePath).map((item) => {
        const method = (item.request?.method ?? 'GET').toUpperCase();
        const relativePath = toOpenApiRelativePath(getPathFromItem(item), serverBasePath);
        const metadata = metadataIndex.get(`${method} ${relativePath}`);
        const placement = deriveAdminPlacement(getPathFromItem(item), relativePath, metadata?.summary);
        return { item, placement };
    });
}

/** Move unversioned requests (paths not under api/vN/) under `root/`. */
export function groupUnversionedRequests(
    items: PostmanItem[] | undefined,
    metadataIndex: Map<string, OperationMetadata>,
    options: { serverBasePath: string[] },
): void {
    if (!Array.isArray(items)) return;

    const extracted = extractUnversionedRequests(items);
    if (extracted.length === 0) return;

    let rootFolder = items.find((entry) => entry.name === 'root' && Array.isArray(entry.item));
    if (!rootFolder) {
        rootFolder = { name: 'root', item: [] };
        items.unshift(rootFolder);
    }

    for (const item of extracted) {
        const method = (item.request?.method ?? 'GET').toUpperCase();
        const relativePath = toOpenApiRelativePath(getPathFromItem(item), options.serverBasePath);
        const metadata = metadataIndex.get(`${method} ${relativePath}`);
        item.name = metadata?.summary ?? item.name ?? relativePath;
        rootFolder.item = [...(rootFolder.item ?? []), item];
    }
}

/** Move Admin-tagged requests under `v1/admin/<domain>/`. */
export function groupAdminTaggedRequests(
    items: PostmanItem[] | undefined,
    metadataIndex: Map<string, OperationMetadata>,
    options: { adminTag: string; serverBasePath: string[] },
): void {
    if (!Array.isArray(items)) return;

    const extracted = extractAdminRequests(items, metadataIndex, options.adminTag, options.serverBasePath);
    if (extracted.length === 0) return;

    for (const { item, placement } of extracted) {
        let versionFolder = items.find((entry) => entry.name === placement.version && Array.isArray(entry.item));
        if (!versionFolder) {
            versionFolder = { name: placement.version, item: [] };
            items.push(versionFolder);
        }

        const adminFolder = findOrCreateFolder(versionFolder, 'admin');
        const domainFolder = findOrCreateFolder(adminFolder, placement.domain);
        item.name = placement.requestName;
        domainFolder.item = [...(domainFolder.item ?? []), item];
    }
}
