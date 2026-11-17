import type { RuleId } from '../pages/rules/catalog.js';
import type { Severity } from '../pages/types.js';

export interface SeoAuditThresholds {
    titleMin: number;
    titleMax: number;
    descriptionMin: number;
    descriptionMax: number;
}

export interface SeoAuditConfig {
    /** Env var read when --secret is omitted. No env fallback when unset. */
    secretEnv?: string;
    locales?: { supported?: readonly string[]; indexable?: readonly string[]; default?: string };
    sitemaps?: { publicPath?: string; secretIndexPath?: (secret: string) => string };
    robots?: { userAgent?: string; forbiddenSubstrings?: string[]; mustAllow?: string[]; mustDisallow?: string[] };
    notFoundProbes?: string[];
    routes?: { file?: string };
    fetch?: { userAgent?: string };
    crawl?: { skipPathPrefixes?: string[]; skipExtensions?: string[]; queryCapPerPath?: number };
    rules?: {
        thresholds?: Partial<SeoAuditThresholds>;
        overrides?: Partial<Record<RuleId, Severity | 'off'>>;
        requiredOpenGraph?: string[];
        /** Substring that marks a build asset URL; false disables common.assets-single-build. */
        buildAssetMarker?: string | false;
    };
    report?: { outDir?: string };
}

export interface ResolvedSeoAuditConfig {
    rootDir: string;
    secretEnv: string | undefined;
    locales: { supported: readonly string[]; indexable: readonly string[]; default: string | undefined };
    sitemaps: { publicPath: string; secretIndexPath: ((secret: string) => string) | undefined };
    robots: { userAgent: string; forbiddenSubstrings: string[]; mustAllow: string[]; mustDisallow: string[] };
    notFoundProbes: string[];
    routesFile: string | undefined;
    userAgent: string;
    crawl: { skipPathPrefixes: string[]; skipExtensions: string[]; queryCapPerPath: number };
    rules: {
        thresholds: SeoAuditThresholds;
        overrides: Partial<Record<RuleId, Severity | 'off'>>;
        requiredOpenGraph: string[];
        buildAssetMarker: string | false;
    };
    reportOutDir: string;
}
