import { describe, expect, it } from 'vitest';

import type { ResolvedSeoAuditConfig } from '../config/types.js';

import { checkLocsAllowedByRobots, checkRobotsBody, checkRobotsResponse } from './robots-checks.js';

const ORIGIN = 'https://example.com';
const ROBOTS = `User-agent: *
Allow: /
Disallow: /dashboard
Disallow: /*/dashboard
Sitemap: https://example.com/sitemap.xml
`;

const robots: ResolvedSeoAuditConfig['robots'] = {
    userAgent: 'Googlebot',
    forbiddenSubstrings: ['/sitemaps/'],
    mustAllow: ['/en', '/en/properties'],
    mustDisallow: ['/en/dashboard'],
};

describe('robots-checks', () => {
    it('requires HTTP 200 and text/plain', () => {
        expect(checkRobotsResponse(200, 'text/plain; charset=utf-8').ok).toBe(true);
        expect(checkRobotsResponse(500, 'text/plain').ok).toBe(false);
        expect(checkRobotsResponse(200, 'text/html').ok).toBe(false);
    });

    it('requires absolute same-origin Sitemap lines and Googlebot access rules', () => {
        const [sitemaps, googlebot] = checkRobotsBody(ROBOTS, ORIGIN, robots);
        expect(sitemaps.ok).toBe(true);
        expect(googlebot.ok).toBe(true);
    });

    it('fails when robots mention /sitemaps/ or a relative Sitemap', () => {
        const body = `User-agent: *
Allow: /
Sitemap: /sitemap.xml
Disallow: /sitemaps/
`;
        const [sitemaps] = checkRobotsBody(body, ORIGIN, robots);
        expect(sitemaps.ok).toBe(false);
        expect(sitemaps.messages.join('\n')).toMatch(/\/sitemaps\//);
        expect(sitemaps.messages.join('\n')).toMatch(/not an absolute URL/);
    });

    it('flags sitemap locs that robots disallow for Googlebot', () => {
        const result = checkLocsAllowedByRobots(ROBOTS, ORIGIN, [{ loc: `${ORIGIN}/en/dashboard` }], robots.userAgent);
        expect(result.ok).toBe(false);
    });
});
