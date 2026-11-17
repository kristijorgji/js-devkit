import { cliLogger, logFatalAndExit } from '@kristijorgji/cli-kit';

import type { ResolvedSeoAuditConfig } from '../config/types.js';

import { formatCheckLine } from './format-result.js';
import { probeNotFoundPages } from './not-found-probe.js';
import { checkSampledPage, sampleLocs } from './page-checks.js';
import { parseSeoValidateArgs } from './parse-args.js';
import { checkPublicSubset } from './public-subset.js';
import { checkLocsAllowedByRobots, checkRobotsBody, checkRobotsResponse } from './robots-checks.js';
import type { SeoCheckResult } from './types.js';
import { collectPageLocsFromSitemap } from './walk-sitemaps.js';

async function fetchText(
    url: string,
    init: RequestInit = {},
): Promise<{ status: number; contentType: string | null; body: string; robotsTag: string | null }> {
    const response = await fetch(url, { redirect: 'manual', ...init });
    return {
        status: response.status,
        contentType: response.headers.get('content-type'),
        body: await response.text(),
        robotsTag: response.headers.get('x-robots-tag'),
    };
}

function printResults(results: SeoCheckResult[], secret?: string): boolean {
    let failed = false;
    for (const result of results) {
        const line = formatCheckLine(result, secret);
        if (result.ok) {
            cliLogger.info(line);
            continue;
        }
        failed = true;
        cliLogger.error(line);
    }
    return failed;
}

export async function runSitemapChecks(argv: string[], config: ResolvedSeoAuditConfig): Promise<boolean> {
    const args = parseSeoValidateArgs(argv, config.secretEnv ? process.env[config.secretEnv] : undefined);
    const origin = args.baseUrl;
    const results: SeoCheckResult[] = [];
    const publicLocs: string[] = [];
    const secretLocs: string[] = [];

    const robots = await fetchText(`${origin}/robots.txt`);
    results.push(checkRobotsResponse(robots.status, robots.contentType));
    if (robots.status === 200) {
        results.push(...checkRobotsBody(robots.body, origin, config.robots));
    }

    const publicUrls = await collectPageLocsFromSitemap(
        `${origin}${config.sitemaps.publicPath}`,
        origin,
        results,
        fetchText,
    );
    publicLocs.push(...publicUrls.map((row) => row.loc));

    if (args.secret) {
        if (!config.sitemaps.secretIndexPath) {
            logFatalAndExit('--secret requires sitemaps.secretIndexPath in seo-audit config');
        }
        const indexUrl = `${origin}${config.sitemaps.secretIndexPath(args.secret)}`;
        const secretUrls = await collectPageLocsFromSitemap(indexUrl, origin, results, fetchText);
        secretLocs.push(...secretUrls.map((row) => row.loc));
        results.push(checkPublicSubset(publicLocs, secretLocs));
    }

    const allPageLocs: string[] = [...publicLocs, ...secretLocs];
    if (robots.status === 200) {
        results.push(
            checkLocsAllowedByRobots(
                robots.body,
                origin,
                allPageLocs.map((loc) => ({ loc })),
                config.robots.userAgent,
            ),
        );
    }

    for (const loc of sampleLocs(allPageLocs.length > 0 ? allPageLocs : publicLocs, args.sample)) {
        const page = await fetchText(loc);
        results.push(
            checkSampledPage({
                loc,
                status: page.status,
                html: page.body,
                robotsTag: page.robotsTag,
            }),
        );
    }

    results.push(...(await probeNotFoundPages(origin, config.notFoundProbes)));

    return printResults(results, args.secret);
}
