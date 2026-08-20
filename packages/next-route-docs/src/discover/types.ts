import type { ParsedRouteExports } from '../parse/parse-route-source.js';

export type PageAuth = string;

export interface DiscoveredAppPage {
    kind: 'page';
    /** Relative to `appDir`, e.g. `[locale]/posts/page.tsx` */
    sourcePath: string;
    /** Page source only — declared segment config. */
    declared: ParsedRouteExports;
    /** Page + parent layouts (dynamic APIs from layouts). */
    parsed: ParsedRouteExports;
}

export type InfraKind = 'metadata' | 'image' | 'static' | 'handler';

export interface DiscoveredInfraRoute {
    kind: InfraKind;
    /** Relative to `appRoot` (e.g. `src/app/robots.ts`, `public/favicon.ico`) */
    sourcePath: string;
    methods: string[];
    urlPattern: string;
    localeScoped: boolean;
    parsed: ParsedRouteExports;
}

export type DiscoveredRoute = DiscoveredAppPage | DiscoveredInfraRoute;
