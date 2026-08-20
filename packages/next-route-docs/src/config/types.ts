import type { AdapterId } from '../adapters/types.js';
import type { DiscoveredAppPage, DiscoveredRoute } from '../discover/types.js';

export type { DiscoveredAppPage, DiscoveredInfraRoute, DiscoveredRoute } from '../discover/types.js';

export type RouteDocsOutput = 'markdown' | 'json' | 'html';

export interface RouteDescription {
    summary?: string;
    auth?: string;
    indexable?: boolean;
    rendering?: string;
}

export interface RouteDocsConfig {
    appRoot: string;
    appDir?: string;
    publicDir?: string;
    distDir?: string;
    outDir?: string;
    basename?: string;
    outputs?: RouteDocsOutput[];
    viewerTitle?: string;
    adapter?: 'auto' | AdapterId;
    locales?: string[];
    localeParam?: string;
    resolveRouteName?: (appRelativeSourcePath: string) => string | null;
    resolveLocalizedPath?: (routeName: string, locale: string) => string | null;
    resolveAuth?: (route: DiscoveredRoute) => string | null;
    resolveIndexable?: (page: DiscoveredAppPage) => boolean | null;
    describe?: (key: string) => RouteDescription | undefined;
    ignorePublicPaths?: string[];
    formatMarkdown?: (markdown: string) => string;
}

export interface ResolvedRouteDocsConfig {
    appRoot: string;
    appDir: string;
    publicDir: string;
    distDir: string;
    outDir: string;
    basename: string;
    outputs: RouteDocsOutput[];
    viewerTitle: string;
    adapter: 'auto' | AdapterId;
    locales: string[];
    localeParam: string;
    resolveRouteName: (appRelativeSourcePath: string) => string | null;
    resolveLocalizedPath: (routeName: string, locale: string) => string | null;
    resolveAuth: (route: DiscoveredRoute) => string | null;
    resolveIndexable: (page: DiscoveredAppPage) => boolean | null;
    describe: (key: string) => RouteDescription | undefined;
    ignorePublicPaths: string[];
    formatMarkdown: (markdown: string) => string;
}
