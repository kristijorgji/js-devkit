import { readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

import { mergeParsedRouteExports, parseRouteSource } from '../parse/parse-route-source.js';

import type { DiscoveredAppPage } from './types.js';
import { walkFiles } from './walk-files.js';

function toAppRelative(appRoot: string, absPath: string): string {
    return relative(appRoot, absPath).split('\\').join('/');
}

function parentLayoutSources(appDir: string, pageSourcePath: string) {
    const dirSegments = pageSourcePath.split('/').slice(0, -1);
    const layouts = [];
    for (let i = dirSegments.length; i >= 0; i -= 1) {
        const layoutRel = [...dirSegments.slice(0, i), 'layout.tsx'].join('/');
        const layoutAbs = join(appDir, layoutRel);
        if (statSync(layoutAbs, { throwIfNoEntry: false })?.isFile()) {
            layouts.push(parseRouteSource(readFileSync(layoutAbs, 'utf8')));
        }
    }
    return layouts;
}

export function discoverAppPages(appDir: string): DiscoveredAppPage[] {
    const pages = walkFiles(appDir, (p) => p.endsWith('/page.tsx') || p.endsWith(`${join('', 'page.tsx')}`));

    return pages
        .map((absPath) => {
            const sourcePath = toAppRelative(appDir, absPath);
            const source = readFileSync(absPath, 'utf8');
            const declared = parseRouteSource(source);
            return {
                kind: 'page' as const,
                sourcePath,
                declared,
                parsed: mergeParsedRouteExports(declared, parentLayoutSources(appDir, sourcePath)),
            };
        })
        .sort((a, b) => a.sourcePath.localeCompare(b.sourcePath));
}
