import { readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

import { matchesAnyGlob } from '../lib/glob-match.js';
import {
    detectRouteHandlerMethods,
    emptyParsedRouteExports,
    parseRouteSource,
} from '../parse/parse-route-source.js';

import type { DiscoveredInfraRoute } from './types.js';
import { walkFiles } from './walk-files.js';

const ROUTE_GROUP_SEGMENT = /^\([^)]+\)$/;

export interface DiscoverInfraOptions {
    localeParam: string;
    ignorePublicPaths: string[];
}

function toWebRelative(appRoot: string, absPath: string): string {
    return relative(appRoot, absPath).split('\\').join('/');
}

function toAppRelative(appDir: string, absPath: string): string {
    return relative(appDir, absPath).split('\\').join('/');
}

function urlPatternFromRouteFile(appRelative: string): string {
    const withoutFile = appRelative.replace(/\/route\.ts$/, '');
    const segments = withoutFile.split('/').filter((seg) => !ROUTE_GROUP_SEGMENT.test(seg));
    return `/${segments.join('/')}`;
}

export function discoverInfraRoutes(
    appDir: string,
    publicDir: string,
    appRoot: string,
    options: DiscoverInfraOptions,
): DiscoveredInfraRoute[] {
    const routes: DiscoveredInfraRoute[] = [];
    const localePattern = `/{${options.localeParam}}`;

    const robotsPath = join(appDir, 'robots.ts');
    const sitemapPath = join(appDir, 'sitemap.ts');
    if (statSync(robotsPath, { throwIfNoEntry: false })?.isFile()) {
        routes.push({
            kind: 'metadata',
            sourcePath: toWebRelative(appRoot, robotsPath),
            methods: ['GET'],
            urlPattern: '/robots.txt',
            localeScoped: false,
            parsed: parseRouteSource(readFileSync(robotsPath, 'utf8')),
        });
    }
    if (statSync(sitemapPath, { throwIfNoEntry: false })?.isFile()) {
        routes.push({
            kind: 'metadata',
            sourcePath: toWebRelative(appRoot, sitemapPath),
            methods: ['GET'],
            urlPattern: '/sitemap.xml',
            localeScoped: false,
            parsed: parseRouteSource(readFileSync(sitemapPath, 'utf8')),
        });
    }

    for (const absPath of walkFiles(appDir, (p) => p.endsWith('/opengraph-image.tsx'))) {
        routes.push({
            kind: 'image',
            sourcePath: toWebRelative(appRoot, absPath),
            methods: ['GET'],
            urlPattern: `${localePattern}/opengraph-image`,
            localeScoped: true,
            parsed: parseRouteSource(readFileSync(absPath, 'utf8')),
        });
    }

    for (const iconName of ['icon.png', 'apple-icon.png'] as const) {
        const absPath = join(appDir, iconName);
        if (statSync(absPath, { throwIfNoEntry: false })?.isFile()) {
            routes.push({
                kind: 'image',
                sourcePath: toWebRelative(appRoot, absPath),
                methods: ['GET'],
                urlPattern: iconName === 'icon.png' ? '/icon' : '/apple-icon',
                localeScoped: false,
                parsed: emptyParsedRouteExports,
            });
        }
    }

    for (const absPath of walkFiles(appDir, (p) => p.endsWith('/route.ts'))) {
        const appRelative = toAppRelative(appDir, absPath);
        const source = readFileSync(absPath, 'utf8');
        const methods = detectRouteHandlerMethods(source);
        routes.push({
            kind: 'handler',
            sourcePath: toWebRelative(appRoot, absPath),
            methods: methods.length > 0 ? methods : ['GET'],
            urlPattern: urlPatternFromRouteFile(appRelative),
            localeScoped: false,
            parsed: parseRouteSource(source),
        });
    }

    if (statSync(publicDir, { throwIfNoEntry: false })?.isDirectory()) {
        for (const absPath of walkFiles(publicDir, (p) => !statSync(p).isDirectory())) {
            const relPublic = relative(publicDir, absPath).split('\\').join('/');
            if (matchesAnyGlob(relPublic, options.ignorePublicPaths)) continue;
            routes.push({
                kind: 'static',
                sourcePath: toWebRelative(appRoot, absPath),
                methods: ['GET'],
                urlPattern: `/${relPublic}`,
                localeScoped: false,
                parsed: emptyParsedRouteExports,
            });
        }
    }

    return routes.sort((a, b) => a.urlPattern.localeCompare(b.urlPattern));
}
