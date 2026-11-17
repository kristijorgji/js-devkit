import path from 'node:path';

import { classifyUrl, loadRouteMatchers, type RouteMatcher, type WebRoutesDocument } from './classify-route.js';
import type { ResolvedSeoAuditConfig } from '../config/types.js';
import { createPool, fetchPage } from './fetch-page.js';
import { type LighthouseBatchRunner, pickLighthouseUrls, runLighthouse } from './lighthouse.js';
import { hasNoindex } from './parse-page.js';
import { interleaveSeedsByRoute } from './prioritize-seeds.js';
import { buildReport, writeReport } from './report-json.js';
import { applyCommonRules } from './rules/common.js';
import { applyCrossPageRules } from './rules/cross-page.js';
import { applyIndexableRules } from './rules/indexable.js';
import { issue } from './rules/issue.js';
import { applyNoindexRules } from './rules/noindex.js';
import { applyRuleOverrides } from './rules/overrides.js';
import { collectSeedUrls, crawl, type CrawledRecord, type SeedFetchIssue } from './sources.js';
import type { PageAudit, RuleContext, SeoAuditArgs, SeoAuditReport } from './types.js';

function seedIssuePage(
    seedIssue: SeedFetchIssue,
    matchers: readonly RouteMatcher[],
    supportedLocales: readonly string[],
): PageAudit {
    const classified = classifyUrl(seedIssue.url, matchers, supportedLocales);
    return {
        url: seedIssue.url,
        locale: classified.locale,
        routeName: classified.routeName,
        status: seedIssue.status,
        indexable: false,
        robotsSource: 'none',
        inSitemap: 'secret',
        discoveredVia: 'sitemap',
        issues: [issue('common.http-status', seedIssue.message)],
    };
}

function robotsSource(record: CrawledRecord): PageAudit['robotsSource'] {
    const meta = Boolean(record.parsed?.metaRobots?.trim());
    const header = Boolean(record.fetched.robotsHeader?.trim());
    if (meta && header) {
        return 'both';
    }
    if (meta) {
        return 'meta';
    }
    if (header) {
        return 'header';
    }
    return 'none';
}

function toPageAudit(
    url: string,
    record: CrawledRecord,
    matchers: readonly RouteMatcher[],
    ctx: RuleContext,
    supportedLocales: readonly string[],
): PageAudit {
    const classified = classifyUrl(url, matchers, supportedLocales);
    const noindex = hasNoindex(record.parsed?.metaRobots, record.fetched.robotsHeader ?? undefined);
    const html = record.fetched.status === 200 && record.parsed !== undefined;
    const page: PageAudit = {
        url,
        locale: classified.locale,
        routeName: classified.routeName,
        status: record.fetched.status,
        indexable: html && !noindex,
        robotsSource: robotsSource(record),
        inSitemap: record.inSitemap,
        discoveredVia: record.discoveredVia,
        ...(record.parsed ? { parsed: record.parsed } : {}),
        issues: [],
    };
    page.issues.push(...applyCommonRules(page, ctx));
    if (html && page.indexable) {
        page.issues.push(...applyIndexableRules(page, ctx));
    } else if (html && noindex) {
        page.issues.push(...applyNoindexRules(page, ctx));
    }
    return page;
}

async function fetchRobots(baseUrl: string, fetchImpl: typeof fetch, userAgent: string): Promise<string> {
    const response = await fetchImpl(`${baseUrl}/robots.txt`, {
        redirect: 'manual',
        headers: { 'user-agent': userAgent, accept: 'text/plain' },
    });
    if (response.status !== 200) {
        throw new Error(`robots.txt returned HTTP ${response.status}`);
    }
    return response.text();
}

function homePrefix(
    records: Map<string, CrawledRecord>,
    baseUrl: string,
    defaultLocale: string | undefined,
): string | undefined {
    const origin = new URL(baseUrl).origin;
    if (!defaultLocale) {
        return records.get(`${origin}/`)?.parsed?.nextStaticPrefixes[0];
    }
    const home = records.get(`${origin}/${defaultLocale}`) ?? records.get(`${origin}/${defaultLocale}/`);
    return home?.parsed?.nextStaticPrefixes[0];
}

export async function runSeoAudit(input: {
    args: SeoAuditArgs;
    routes: WebRoutesDocument;
    config: ResolvedSeoAuditConfig;
    fetchImpl?: typeof fetch;
    lighthouseRunner?: LighthouseBatchRunner;
}): Promise<{ report: SeoAuditReport; jsonPath: string; htmlPath: string }> {
    const fetchImpl = input.fetchImpl ?? fetch;
    const robotsBody = await fetchRobots(input.args.baseUrl, fetchImpl, input.config.userAgent);
    const collected = await collectSeedUrls({
        baseUrl: input.args.baseUrl,
        secret: input.args.secret,
        fetchImpl,
        userAgent: input.config.userAgent,
        publicPath: input.config.sitemaps.publicPath,
        secretIndexPath: input.config.sitemaps.secretIndexPath,
    });
    const matchers = loadRouteMatchers(input.routes);
    const orderedSeedUrls = interleaveSeedsByRoute(
        [...collected.seeds.keys()],
        matchers,
        input.args.maxUrls,
        input.config.locales.supported,
    );
    const seeds = new Map(
        orderedSeedUrls.flatMap((url) => {
            const membership = collected.seeds.get(url);
            return membership === undefined ? [] : [[url, membership] as const];
        }),
    );
    const pool = createPool(input.args.concurrency);
    const crawled = await crawl({
        baseUrl: input.args.baseUrl,
        seeds,
        locales: input.args.locales,
        maxUrls: input.args.maxUrls,
        crawlDepth: input.args.crawlDepth,
        robotsBody,
        fetchOne: (url) => pool(() => fetchPage(url, fetchImpl, input.config.userAgent)),
        skipPathPrefixes: input.config.crawl.skipPathPrefixes,
        skipExtensions: input.config.crawl.skipExtensions,
        queryCapPerPath: input.config.crawl.queryCapPerPath,
        buildAssetMarker: input.config.rules.buildAssetMarker,
    });
    const buildPrefix = homePrefix(crawled, input.args.baseUrl, input.config.locales.default);
    const ctx: RuleContext = {
        locales: input.args.locales,
        indexableLocales: input.config.locales.indexable,
        baseUrl: input.args.baseUrl,
        ...(buildPrefix ? { buildPrefix } : {}),
        secretMode: Boolean(input.args.secret),
        thresholds: input.config.rules.thresholds,
        requiredOpenGraph: input.config.rules.requiredOpenGraph,
    };
    const pages: PageAudit[] = [
        ...collected.seedIssues.map((seedIssue) =>
            seedIssuePage(seedIssue, matchers, input.config.locales.supported),
        ),
        ...[...crawled.entries()].map(([url, record]) =>
            toPageAudit(url, record, matchers, ctx, input.config.locales.supported),
        ),
    ];
    applyCrossPageRules(pages, { baseUrl: input.args.baseUrl, supportedLocales: input.config.locales.supported });
    applyRuleOverrides(pages, input.config.rules.overrides);
    if (input.args.lighthouse > 0) {
        const scores = await runLighthouse(pickLighthouseUrls(pages, input.args.lighthouse), input.lighthouseRunner);
        for (const page of pages) {
            const score = scores.get(page.url);
            if (score) {
                page.lighthouse = score;
            }
        }
    }
    const report = buildReport({
        pages,
        routes: input.routes,
        baseUrl: input.args.baseUrl,
        buildPrefix,
    });
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outDir = input.args.outDir ?? path.join(input.config.reportOutDir, stamp);
    const written = writeReport(outDir, report);
    return { report, jsonPath: written.jsonPath, htmlPath: written.htmlPath };
}
