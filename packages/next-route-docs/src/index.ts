export { detectAdapter, getAdapterById } from './adapters/detect.js';
export type { AdapterId, NextRouteBuildAdapter, PrerenderInfo, RouteDocsAdapterCapabilities } from './adapters/types.js';
export { auditCatalog, appSourcePathToNextPattern, formatManifestRendering } from './catalog/audit.js';
export type { AuditResult } from './catalog/audit.js';
export { buildRouteCatalog } from './catalog/build-catalog.js';
export type { AppPageCatalogRow, InfraCatalogRow, RouteCatalog } from './catalog/build-catalog.js';
export { renderRoutesHtml } from './catalog/render-html.js';
export { serializeRouteCatalog } from './catalog/render-json.js';
export { renderRoutesMarkdown } from './catalog/render-markdown.js';
export { defineRouteDocsConfig, loadConfig, resolveRouteDocsConfig } from './config/index.js';
export type { ResolvedRouteDocsConfig, RouteDescription, RouteDocsConfig } from './config/index.js';
export { discoverAppPages } from './discover/discover-app-pages.js';
export { discoverInfraRoutes } from './discover/discover-infra-routes.js';
export type { DiscoveredAppPage, DiscoveredInfraRoute, DiscoveredRoute } from './discover/types.js';
export {
    detectRouteHandlerMethods,
    formatInfraRendering,
    formatPageRendering,
    isDeclaredCacheableRendering,
    mergeParsedRouteExports,
    parseRouteSource,
} from './parse/parse-route-source.js';
export type { ParsedRouteExports } from './parse/parse-route-source.js';
