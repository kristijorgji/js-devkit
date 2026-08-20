import { detectAdapter } from '../adapters/detect.js';
import type { PrerenderInfo } from '../adapters/types.js';
import type { ResolvedRouteDocsConfig } from '../config/types.js';
import { discoverAppPages } from '../discover/discover-app-pages.js';
import { formatPageRendering, isDeclaredCacheableRendering } from '../parse/parse-route-source.js';

const ROUTE_GROUP_SEGMENT = /^\([^)]+\)$/;

export type AuditResult =
    | { skipped: true; reason: string; mismatches: string[] }
    | { skipped: false; mismatches: string[] };

/** `[locale]/(cached)/posts/page.tsx` → `/[locale]/posts` */
export function appSourcePathToNextPattern(sourcePath: string): string {
    const withoutFile = sourcePath.replace(/\/page\.tsx$/, '');
    const segments = withoutFile.split('/').filter((seg) => seg.length > 0 && !ROUTE_GROUP_SEGMENT.test(seg));
    return `/${segments.join('/')}`;
}

export function formatManifestRendering(
    manifest: PrerenderInfo,
    nextPattern: string,
    localeParam: string,
    sampleLocale: string,
): string | null {
    const localizedSample = nextPattern.replace(`/[${localeParam}]`, `/${sampleLocale}`).replace(/\/$/, '') || `/${sampleLocale}`;
    const prerendered = manifest.routes[localizedSample] ?? manifest.routes[`${localizedSample}/`];
    if (prerendered) {
        const seconds = prerendered.initialRevalidateSeconds;
        if (seconds === false || seconds === undefined) {
            return 'Static';
        }
        return `Build-time SSG + ISR (${seconds}s)`;
    }
    const dynamic = manifest.dynamicRoutes[nextPattern];
    if (dynamic) {
        const seconds = dynamic.initialRevalidateSeconds;
        if (typeof seconds === 'number') {
            return `On-demand ISR (${seconds}s)`;
        }
        return 'On-demand ISR';
    }
    return 'Dynamic (per request)';
}

export function auditCatalog(config: ResolvedRouteDocsConfig): AuditResult {
    const adapter = detectAdapter(config.distDir, config.adapter);
    if (!adapter.capabilities.prerenderManifest) {
        return {
            skipped: true,
            reason: `adapter ${adapter.id} cannot read prerender-manifest.json`,
            mismatches: [],
        };
    }

    const info = adapter.loadPrerenderInfo(config.distDir);
    if (!info) {
        return {
            skipped: true,
            reason: 'prerender-manifest.json not found; run next build first',
            mismatches: [],
        };
    }

    const sampleLocale = config.locales[0] ?? 'en';
    const mismatches: string[] = [];
    for (const page of discoverAppPages(config.appDir)) {
        const declared = formatPageRendering(page.declared);
        if (!isDeclaredCacheableRendering(declared)) continue;
        const pattern = appSourcePathToNextPattern(page.sourcePath);
        const actual = formatManifestRendering(info, pattern, config.localeParam, sampleLocale);
        if (actual === 'Dynamic (per request)') {
            const name = config.resolveRouteName(page.sourcePath) ?? page.sourcePath;
            mismatches.push(`${name}: declared ${declared}, manifest ${actual} (${pattern})`);
        }
    }

    return { skipped: false, mismatches };
}
