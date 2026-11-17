import type { AuditIssue, PageAudit, ParsedPage, RuleContext } from '../types.js';

import { issue } from './issue.js';
import { isAbsoluteHttpUrl, normalizeAuditUrl } from './normalize-url.js';

function lengthIssue(
    ruleId: 'idx.title-length' | 'idx.description-length',
    value: string,
    min: number,
    max: number,
): AuditIssue[] {
    if (value.length >= min && value.length <= max) {
        return [];
    }
    return [issue(ruleId, `length ${value.length} is outside ${min}..${max}`)];
}

function titleIssues(parsed: ParsedPage, ctx: RuleContext): AuditIssue[] {
    const title = parsed.titles[0]?.trim() ?? '';
    if (!title) {
        return [issue('idx.title-present', 'title is missing')];
    }
    return lengthIssue('idx.title-length', title, ctx.thresholds.titleMin, ctx.thresholds.titleMax);
}

function descriptionIssues(parsed: ParsedPage, ctx: RuleContext): AuditIssue[] {
    const description = parsed.metaDescription?.trim() ?? '';
    if (!description) {
        return [issue('idx.description-present', 'meta description is missing')];
    }
    return lengthIssue(
        'idx.description-length',
        description,
        ctx.thresholds.descriptionMin,
        ctx.thresholds.descriptionMax,
    );
}

function canonicalIssues(page: PageAudit, parsed: ParsedPage, ctx: RuleContext): AuditIssue[] {
    if (!parsed.canonical) {
        return [issue('idx.canonical-present', 'canonical link is missing')];
    }
    const canonical = normalizeAuditUrl(parsed.canonical, ctx.baseUrl, ctx.locales);
    const self = normalizeAuditUrl(page.url, ctx.baseUrl, ctx.locales);
    const absolute = isAbsoluteHttpUrl(parsed.canonical);
    if (!absolute || canonical === undefined || canonical !== self) {
        return [issue('idx.canonical-self', `canonical ${parsed.canonical} is not this page`)];
    }
    return [];
}

function hreflangIssues(page: PageAudit, parsed: ParsedPage, ctx: RuleContext): AuditIssue[] {
    const issues: AuditIssue[] = [];
    const langs = new Set(parsed.hreflang.map((entry) => entry.lang));
    const required: string[] = [...ctx.indexableLocales, 'x-default'];
    const missing = required.filter((lang) => !langs.has(lang));
    const badHref = parsed.hreflang.filter((entry) => {
        if (!isAbsoluteHttpUrl(entry.href)) {
            return true;
        }
        return normalizeAuditUrl(entry.href, ctx.baseUrl, ctx.locales) === undefined;
    });
    if (missing.length > 0 || badHref.length > 0) {
        issues.push(
            issue('idx.hreflang-complete', `missing ${missing.join(', ') || 'none'}; bad hrefs ${badHref.length}`),
        );
    }
    const own = parsed.hreflang.find((entry) => entry.lang === page.locale);
    const canonical = parsed.canonical ? normalizeAuditUrl(parsed.canonical, ctx.baseUrl, ctx.locales) : undefined;
    const ownHref = own ? normalizeAuditUrl(own.href, ctx.baseUrl, ctx.locales) : undefined;
    if (own && canonical && ownHref !== canonical) {
        issues.push(issue('idx.hreflang-self', `hreflang ${page.locale} does not equal the canonical`));
    }
    return issues;
}

function openGraphIssues(parsed: ParsedPage, ctx: RuleContext): AuditIssue[] {
    const issues: AuditIssue[] = [];
    const missing = ctx.requiredOpenGraph.filter((key) => !parsed.og[key]);
    if (missing.length > 0) {
        issues.push(issue('idx.og-required', `missing ${missing.join(', ')}`));
    }
    const ogUrl = parsed.og['og:url'];
    const canonical = parsed.canonical;
    if (ogUrl && canonical) {
        const left = normalizeAuditUrl(ogUrl, ctx.baseUrl, ctx.locales);
        const right = normalizeAuditUrl(canonical, ctx.baseUrl, ctx.locales);
        if (!left || !right || left !== right) {
            issues.push(issue('idx.og-url-matches-canonical', 'og:url does not match the canonical'));
        }
    }
    const image = parsed.og['og:image'];
    if (image && !image.startsWith('https://')) {
        issues.push(issue('idx.og-image-absolute', `og:image ${image} is not https`));
    }
    return issues;
}

export function applyIndexableRules(page: PageAudit, ctx: RuleContext): AuditIssue[] {
    const parsed = page.parsed;
    if (!parsed) {
        return [];
    }
    const issues: AuditIssue[] = [
        ...titleIssues(parsed, ctx),
        ...descriptionIssues(parsed, ctx),
        ...canonicalIssues(page, parsed, ctx),
    ];
    issues.push(...hreflangIssues(page, parsed, ctx), ...openGraphIssues(parsed, ctx));
    if (!parsed.twitter['twitter:card']) {
        issues.push(issue('idx.twitter-card', 'twitter:card is missing'));
    }
    if (parsed.h1Count !== 1) {
        issues.push(issue('idx.single-h1', `found ${parsed.h1Count} h1 elements`));
    }
    if (ctx.secretMode && page.inSitemap === null) {
        issues.push(issue('idx.in-sitemap', 'indexable page is not in a sitemap'));
    }
    return issues;
}
