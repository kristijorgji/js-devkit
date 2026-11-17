import type { AuditIssue, PageAudit, RuleContext } from '../types.js';

import { issue } from './issue.js';
import { normalizeAuditUrl } from './normalize-url.js';

export function applyNoindexRules(page: PageAudit, ctx: RuleContext): AuditIssue[] {
    const issues: AuditIssue[] = [];
    if (page.inSitemap !== null) {
        issues.push(issue('noidx.not-in-sitemap', `noindex page is in the ${page.inSitemap} sitemap`));
    }
    const canonical = page.parsed?.canonical;
    if (!canonical) {
        return issues;
    }
    const target = normalizeAuditUrl(canonical, ctx.baseUrl, ctx.locales);
    const self = normalizeAuditUrl(page.url, ctx.baseUrl, ctx.locales);
    if (target && self && target !== self) {
        issues.push(issue('noidx.canonical-elsewhere', `canonical points at ${canonical}`));
    }
    return issues;
}
