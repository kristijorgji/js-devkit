import type { ResolvedRouteDocsConfig } from '../config/types.js';

import type { RouteCatalog } from './build-catalog.js';

export function serializeRouteCatalog(catalog: RouteCatalog, config: ResolvedRouteDocsConfig): string {
    return `${JSON.stringify(
        {
            locales: config.locales,
            appPages: catalog.appPages,
            infraRoutes: catalog.infraRoutes,
        },
        null,
        2,
    )}\n`;
}
