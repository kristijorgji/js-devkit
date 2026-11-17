import { readFileSync } from 'node:fs';
import path from 'node:path';

import type { ResolvedSeoAuditConfig, SeoAuditConfig, SeoAuditThresholds } from './types.js';

const DEFAULT_THRESHOLDS: SeoAuditThresholds = {
    titleMin: 30,
    titleMax: 65,
    descriptionMin: 70,
    descriptionMax: 160,
};

const DEFAULT_OPEN_GRAPH = ['og:title', 'og:description', 'og:url', 'og:image', 'og:type', 'og:site_name'];
const DEFAULT_SKIP_PREFIXES = ['/api', '/_next'];
const DEFAULT_SKIP_EXTENSIONS = ['png', 'jpg', 'webp', 'avif', 'svg', 'pdf', 'xml', 'txt', 'ico'];
const DEFAULT_USER_AGENT = 'kj-seo-audit/1.0 (+https://github.com/kristijorgji/js-devkit)';

function localesFromRoutesFile(routesFile: string): string[] {
    const parsed: unknown = JSON.parse(readFileSync(routesFile, 'utf8'));
    if (typeof parsed !== 'object' || parsed === null || !('locales' in parsed)) {
        return [];
    }
    const locales = (parsed as { locales?: unknown }).locales;
    if (!Array.isArray(locales)) {
        return [];
    }
    return locales.filter((locale): locale is string => typeof locale === 'string');
}

export function resolveSeoAuditConfig(config: SeoAuditConfig, rootDir: string): ResolvedSeoAuditConfig {
    const routesFile = config.routes?.file ? path.resolve(rootDir, config.routes.file) : undefined;
    const supported =
        config.locales?.supported ?? (routesFile === undefined ? [] : localesFromRoutesFile(routesFile));
    const indexable = config.locales?.indexable ?? supported;
    const defaultLocale = config.locales?.default ?? supported[0];
    return {
        rootDir,
        secretEnv: config.secretEnv,
        locales: { supported, indexable, default: defaultLocale },
        sitemaps: {
            publicPath: config.sitemaps?.publicPath ?? '/sitemap.xml',
            secretIndexPath: config.sitemaps?.secretIndexPath,
        },
        robots: {
            userAgent: config.robots?.userAgent ?? 'Googlebot',
            forbiddenSubstrings: config.robots?.forbiddenSubstrings ?? [],
            mustAllow: config.robots?.mustAllow ?? ['/'],
            mustDisallow: config.robots?.mustDisallow ?? [],
        },
        notFoundProbes: config.notFoundProbes ?? ['/__kj-seo-404-probe__/x'],
        routesFile,
        userAgent: config.fetch?.userAgent ?? DEFAULT_USER_AGENT,
        crawl: {
            skipPathPrefixes: config.crawl?.skipPathPrefixes ?? DEFAULT_SKIP_PREFIXES,
            skipExtensions: config.crawl?.skipExtensions ?? DEFAULT_SKIP_EXTENSIONS,
            queryCapPerPath: config.crawl?.queryCapPerPath ?? 3,
        },
        rules: {
            thresholds: { ...DEFAULT_THRESHOLDS, ...config.rules?.thresholds },
            overrides: config.rules?.overrides ?? {},
            requiredOpenGraph: config.rules?.requiredOpenGraph ?? [...DEFAULT_OPEN_GRAPH],
            buildAssetMarker: config.rules?.buildAssetMarker ?? '/_next/static/',
        },
        reportOutDir: path.resolve(rootDir, config.report?.outDir ?? '.cache/seo-audit'),
    };
}
