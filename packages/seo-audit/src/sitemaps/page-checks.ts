import { hasNoindex, parsePage } from '../pages/parse-page.js';

import { checkPassed, type SeoCheckResult } from './types.js';

const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);

export function checkSampledPage(args: {
    loc: string;
    status: number;
    html: string;
    robotsTag?: string | null;
}): SeoCheckResult {
    const messages: string[] = [];
    if (REDIRECT_STATUSES.has(args.status)) {
        messages.push(`${args.loc} redirected (${args.status})`);
    } else if (args.status !== 200) {
        messages.push(`${args.loc} HTTP ${args.status} (expected 200)`);
    }

    const parsed = parsePage(args.html, args.loc);
    if (hasNoindex(parsed.metaRobots, args.robotsTag ?? undefined)) {
        messages.push(`${args.loc} has noindex`);
    }

    const canonical = parsed.canonical;
    if (!canonical) {
        messages.push(`${args.loc} is missing <link rel="canonical">`);
    } else if (canonical !== args.loc) {
        messages.push(`${args.loc} canonical is ${canonical}`);
    }

    return checkPassed(`page:${args.loc}`, messages);
}

export function sampleLocs(locs: string[], sample: number | 'all'): string[] {
    const unique: string[] = [...new Set(locs)];
    if (sample === 'all') return unique;
    return unique.slice(0, sample);
}
