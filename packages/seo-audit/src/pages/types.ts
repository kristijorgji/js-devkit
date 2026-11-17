export type Severity = 'error' | 'warn' | 'info';
export type SitemapMembership = 'public' | 'secret' | null;

export interface SeoAuditArgs {
    baseUrl: string;
    secret?: string;
    maxUrls: number;
    crawlDepth: number;
    concurrency: number;
    locales: string[];
    lighthouse: number;
    outDir?: string;
    failOn: Severity | 'none';
}

export interface FetchedPage {
    url: string;
    status: number;
    location: string | null;
    robotsHeader: string | null;
    contentType: string | null;
    html: string;
    durationMs: number;
}

export interface ParsedPage {
    htmlLang?: string;
    titles: string[];
    metaDescription?: string;
    metaRobots?: string;
    canonical?: string;
    hreflang: { lang: string; href: string }[];
    og: Record<string, string>;
    twitter: Record<string, string>;
    h1Count: number;
    jsonLd: string[];
    hasViewport: boolean;
    nextStaticPrefixes: string[];
    links: string[];
}

export interface AuditIssue {
    ruleId: string;
    severity: Severity;
    message: string;
}

export interface PageAudit {
    url: string;
    locale: string;
    routeName: string;
    status: number;
    indexable: boolean;
    robotsSource: 'meta' | 'header' | 'both' | 'none';
    inSitemap: SitemapMembership;
    discoveredVia: 'sitemap' | 'crawl';
    parsed?: ParsedPage;
    issues: AuditIssue[];
    lighthouse?: { seo: number; performance: number; accessibility: number; bestPractices: number };
}

export interface CoverageCell {
    indexable: number;
    noindex: number;
    errors: number;
    warns: number;
}

export interface SeoAuditReport {
    generatedAt: string;
    baseUrl: string;
    buildPrefix?: string;
    summary: { urls: number; indexable: number; noindex: number; errors: number; warns: number; infos: number };
    coverage: Record<string, Record<string, CoverageCell>>;
    uncoveredRoutes: string[];
    pages: PageAudit[];
}

export interface RuleContext {
    locales: readonly string[];
    indexableLocales: readonly string[];
    baseUrl: string;
    buildPrefix?: string;
    secretMode: boolean;
    thresholds: { titleMin: number; titleMax: number; descriptionMin: number; descriptionMax: number };
    requiredOpenGraph: readonly string[];
}
