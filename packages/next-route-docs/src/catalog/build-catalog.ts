import type { ResolvedRouteDocsConfig } from '../config/types.js';
import { discoverAppPages } from '../discover/discover-app-pages.js';
import { discoverInfraRoutes } from '../discover/discover-infra-routes.js';
import { formatInfraRendering, formatPageRendering } from '../parse/parse-route-source.js';

export interface AppPageCatalogRow {
    routeName: string;
    sourcePath: string;
    pathsByLocale: Record<string, string>;
    auth: string;
    declared: string;
    rendering: string;
    indexable: string;
    description: string;
}

export interface InfraCatalogRow {
    methods: string;
    urlPattern: string;
    pathsByLocale: Record<string, string | '-'>;
    kind: string;
    auth: string;
    rendering: string;
    description: string;
    sourcePath: string;
}

export interface RouteCatalog {
    appPages: AppPageCatalogRow[];
    infraRoutes: InfraCatalogRow[];
}

function defaultIndexable(page: { parsed: { hasNoIndexRobots: boolean } }): boolean {
    return !page.parsed.hasNoIndexRobots;
}

export function buildRouteCatalog(config: ResolvedRouteDocsConfig): RouteCatalog {
    const pages = discoverAppPages(config.appDir).map((page) => {
        const routeName = config.resolveRouteName(page.sourcePath);
        const key = routeName ?? page.sourcePath;
        const description = config.describe(key);
        const auth = description?.auth ?? config.resolveAuth(page) ?? 'Public';
        const indexable =
            description?.indexable !== undefined
                ? description.indexable
                : (config.resolveIndexable(page) ?? defaultIndexable(page));
        const pathsByLocale: Record<string, string> = {};
        if (routeName) {
            for (const locale of config.locales) {
                const path = config.resolveLocalizedPath(routeName, locale);
                if (path) pathsByLocale[locale] = path;
            }
        }
        return {
            routeName: routeName ?? '-',
            sourcePath: page.sourcePath,
            pathsByLocale,
            auth,
            declared: formatPageRendering(page.declared),
            rendering: description?.rendering ?? formatPageRendering(page.parsed),
            indexable: indexable ? 'Yes' : 'No',
            description: description?.summary ?? page.sourcePath,
        };
    });

    const infraRoutes = discoverInfraRoutes(config.appDir, config.publicDir, config.appRoot, {
        localeParam: config.localeParam,
        ignorePublicPaths: config.ignorePublicPaths,
    }).map((route) => {
        const description = config.describe(route.sourcePath);
        const pathsByLocale: Record<string, string | '-'> = {};
        if (route.localeScoped) {
            for (const locale of config.locales) {
                pathsByLocale[locale] = `/${locale}/opengraph-image`;
            }
        } else {
            for (const locale of config.locales) {
                pathsByLocale[locale] = '-';
            }
        }
        return {
            methods: route.methods.join(', '),
            urlPattern: route.urlPattern,
            pathsByLocale,
            kind: route.kind,
            auth: description?.auth ?? config.resolveAuth(route) ?? 'Public',
            rendering: description?.rendering ?? formatInfraRendering(route.parsed),
            description: description?.summary ?? route.sourcePath,
            sourcePath: route.sourcePath,
        };
    });

    return {
        appPages: pages.sort((a, b) => a.routeName.localeCompare(b.routeName) || a.sourcePath.localeCompare(b.sourcePath)),
        infraRoutes,
    };
}
