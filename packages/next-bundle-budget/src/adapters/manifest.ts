import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export interface AppBuildManifest {
    pages?: Record<string, string[]>;
}

export interface BuildManifest {
    polyfillFiles?: string[];
    rootMainFiles?: string[];
}

export function readJsonFile<T>(path: string): T | null {
    if (!existsSync(path)) {
        return null;
    }
    return JSON.parse(readFileSync(path, 'utf8')) as T;
}

export function readBuildManifest(distDir: string): BuildManifest | null {
    return readJsonFile<BuildManifest>(join(distDir, 'build-manifest.json'));
}

export function readAppBuildManifest(distDir: string): AppBuildManifest | null {
    return readJsonFile<AppBuildManifest>(join(distDir, 'app-build-manifest.json'));
}

export function readSharedBaselineFromManifest(manifest: BuildManifest | null): string[] {
    if (!manifest) {
        return [];
    }
    return [...(manifest.polyfillFiles ?? []), ...(manifest.rootMainFiles ?? [])];
}

export function collectAncestorLayoutKeys(pageAppPath: string, manifestKeys: Set<string>): string[] {
    const layouts: string[] = [];
    if (manifestKeys.has('/layout')) {
        layouts.push('/layout');
    }

    const segments = pageAppPath.split('/').filter(Boolean);
    let path = '';
    for (let index = 0; index < segments.length - 1; index += 1) {
        path += `/${segments[index]}`;
        const layoutKey = `${path}/layout`;
        if (manifestKeys.has(layoutKey)) {
            layouts.push(layoutKey);
        }
    }

    return layouts;
}
