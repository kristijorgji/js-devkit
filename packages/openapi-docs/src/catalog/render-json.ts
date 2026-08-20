import type { RouteCatalogRow } from './build-catalog.js';

export function serializeRouteCatalog(rows: RouteCatalogRow[]): string {
    return `${JSON.stringify({ routes: rows }, null, 2)}\n`;
}
