import type { ResolvedSeoAuditConfig } from '../config/types.js';
import { robotsParser } from '../robots-parser.js';

import { checkFailed, checkPassed, type SeoCheckResult, type SitemapUrlRecord } from './types.js';

export function checkRobotsResponse(status: number, contentType: string | null): SeoCheckResult {
    const messages: string[] = [];
    if (status !== 200) {
        messages.push(`HTTP ${status} (expected 200)`);
    }
    if (!contentType?.toLowerCase().includes('text/plain')) {
        messages.push(`Content-Type ${contentType ?? '(missing)'} (expected text/plain)`);
    }
    return checkPassed('robots-response', messages);
}

export function checkRobotsBody(
    body: string,
    origin: string,
    robotsConfig: ResolvedSeoAuditConfig['robots'],
): [SeoCheckResult, SeoCheckResult] {
    const robotsUrl = `${origin}/robots.txt`;
    const robots = robotsParser(robotsUrl, body);
    const sitemapMessages: string[] = [];
    for (const substring of robotsConfig.forbiddenSubstrings) {
        if (body.includes(substring)) {
            sitemapMessages.push(`body must not mention ${substring}`);
        }
    }
    for (const sitemap of robots.getSitemaps()) {
        let parsed: URL;
        try {
            parsed = new URL(sitemap);
        } catch {
            sitemapMessages.push(`Sitemap is not an absolute URL: ${sitemap}`);
            continue;
        }
        if (parsed.origin !== new URL(origin).origin) {
            sitemapMessages.push(`Sitemap is not same-origin: ${sitemap}`);
        }
    }

    const accessMessages: string[] = [];
    for (const path of robotsConfig.mustAllow) {
        const url = `${origin}${path}`;
        if (robots.isAllowed(url, robotsConfig.userAgent) !== true) {
            accessMessages.push(`${robotsConfig.userAgent} must be allowed on ${url}`);
        }
    }
    for (const path of robotsConfig.mustDisallow) {
        const url = `${origin}${path}`;
        if (robots.isAllowed(url, robotsConfig.userAgent) !== false) {
            accessMessages.push(`${robotsConfig.userAgent} must be disallowed on ${url}`);
        }
    }

    return [checkPassed('robots-sitemaps', sitemapMessages), checkPassed('robots-googlebot', accessMessages)];
}

export function checkLocsAllowedByRobots(
    body: string,
    origin: string,
    urls: SitemapUrlRecord[],
    userAgent: string,
): SeoCheckResult {
    const robots = robotsParser(`${origin}/robots.txt`, body);
    const blocked = urls.filter((row) => robots.isAllowed(row.loc, userAgent) === false).map((row) => row.loc);
    if (blocked.length === 0) {
        return checkPassed('robots-cross-check');
    }
    return checkFailed(
        'robots-cross-check',
        blocked.slice(0, 10).map((loc) => `${userAgent} is disallowed on sitemap loc ${loc}`),
    );
}
