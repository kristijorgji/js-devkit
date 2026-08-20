export type AdapterId = 'next15' | 'next16';

export interface RouteDocsAdapterCapabilities {
    /** false when prerender-manifest.json is absent or unreadable: audit degrades to a warning */
    prerenderManifest: boolean;
}

export interface PrerenderRouteInfo {
    initialRevalidateSeconds?: number | false;
}

export interface PrerenderInfo {
    routes: Record<string, PrerenderRouteInfo>;
    dynamicRoutes: Record<string, PrerenderRouteInfo>;
}

export interface NextRouteBuildAdapter {
    readonly id: AdapterId;
    readonly capabilities: RouteDocsAdapterCapabilities;
    detect(ctx: { distDir: string }): boolean;
    loadPrerenderInfo(distDir: string): PrerenderInfo | null;
}
