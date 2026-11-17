import type { PageAudit } from '../types.js';

import { issue } from './issue.js';
import { normalizeAuditUrl } from './normalize-url.js';

function originOf(pages: readonly PageAudit[], fallback: string): string {
    const sample = pages.find((page) => page.url.startsWith('http'));
    if (!sample) {
        return fallback;
    }
    return new URL(sample.url).origin;
}

function normalizedHrefs(page: PageAudit, baseUrl: string, locales: readonly string[]): Set<string> {
    const hrefs = new Set<string>();
    for (const entry of page.parsed?.hreflang ?? []) {
        const href = normalizeAuditUrl(entry.href, baseUrl, locales);
        if (href) {
            hrefs.add(href);
        }
    }
    return hrefs;
}

function pageKey(page: PageAudit, baseUrl: string, locales: readonly string[]): string | undefined {
    return normalizeAuditUrl(page.url, baseUrl, locales);
}

export function applyCrossPageRules(
    pages: PageAudit[],
    opts: { baseUrl: string; supportedLocales: readonly string[] },
): void {
    if (pages.length === 0) {
        return;
    }
    const baseUrl = originOf(pages, opts.baseUrl);
    const locales = opts.supportedLocales;
    const byUrl = new Map<string, PageAudit>();
    for (const page of pages) {
        const key = pageKey(page, baseUrl, locales);
        if (key) {
            byUrl.set(key, page);
        }
    }
    for (const page of pages) {
        checkReciprocal(page, byUrl, baseUrl, locales);
        checkCanonicalTarget(page, byUrl, baseUrl, locales);
        checkAlternateStatus(page, byUrl, baseUrl, locales);
    }
    flagDuplicates(pages, 'cross.duplicate-title', (page) => page.parsed?.titles[0]?.trim());
    flagDuplicates(pages, 'cross.duplicate-description', (page) => page.parsed?.metaDescription?.trim());
}

function checkReciprocal(
    page: PageAudit,
    byUrl: Map<string, PageAudit>,
    baseUrl: string,
    locales: readonly string[],
): void {
    const self = pageKey(page, baseUrl, locales);
    if (!self) {
        return;
    }
    for (const entry of page.parsed?.hreflang ?? []) {
        const targetKey = normalizeAuditUrl(entry.href, baseUrl, locales);
        if (!targetKey || targetKey === self) {
            continue;
        }
        const target = byUrl.get(targetKey);
        if (!target) {
            continue;
        }
        if (!normalizedHrefs(target, baseUrl, locales).has(self)) {
            page.issues.push(issue('cross.hreflang-reciprocal', `${target.url} does not list this page`));
        }
    }
}

function checkCanonicalTarget(
    page: PageAudit,
    byUrl: Map<string, PageAudit>,
    baseUrl: string,
    locales: readonly string[],
): void {
    const canonical = page.parsed?.canonical;
    if (!canonical) {
        return;
    }
    const targetKey = normalizeAuditUrl(canonical, baseUrl, locales);
    const self = pageKey(page, baseUrl, locales);
    if (!targetKey || targetKey === self) {
        return;
    }
    const target = byUrl.get(targetKey);
    if (target && (target.status !== 200 || !target.indexable)) {
        page.issues.push(issue('cross.canonical-target-ok', `canonical target ${target.url} is not indexable`));
    }
}

function checkAlternateStatus(
    page: PageAudit,
    byUrl: Map<string, PageAudit>,
    baseUrl: string,
    locales: readonly string[],
): void {
    for (const entry of page.parsed?.hreflang ?? []) {
        const targetKey = normalizeAuditUrl(entry.href, baseUrl, locales);
        const target = targetKey ? byUrl.get(targetKey) : undefined;
        if (!target || target.status === 200) {
            continue;
        }
        // Homepage x-default is the geo-redirecting origin root; 3xx is expected.
        if (entry.lang === 'x-default' && new URL(target.url).pathname === '/' && isRedirectStatus(target.status)) {
            continue;
        }
        page.issues.push(issue('cross.alternate-status', `${entry.lang} alternate returned HTTP ${target.status}`));
    }
}

function isRedirectStatus(status: number): boolean {
    return status >= 300 && status < 400;
}

function flagDuplicates(
    pages: readonly PageAudit[],
    ruleId: 'cross.duplicate-title' | 'cross.duplicate-description',
    valueOf: (page: PageAudit) => string | undefined,
): void {
    const groups = new Map<string, PageAudit[]>();
    for (const page of pages) {
        if (!page.indexable) {
            continue;
        }
        const value = valueOf(page);
        if (!value) {
            continue;
        }
        const key = `${page.locale}\0${value}`;
        const group = groups.get(key) ?? [];
        group.push(page);
        groups.set(key, group);
    }
    for (const group of groups.values()) {
        if (group.length < 2) {
            continue;
        }
        for (const page of group) {
            const others = group
                .filter((other) => other.url !== page.url)
                .slice(0, 5)
                .map((other) => other.url);
            page.issues.push(issue(ruleId, `same value as ${others.join(', ')}`));
        }
    }
}
