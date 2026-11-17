import type { AuditIssue, PageAudit, ParsedPage, RuleContext } from '../types.js';

import { issue } from './issue.js';

function jsonLdBlockOk(value: unknown): boolean {
    if (Array.isArray(value)) {
        return value.length > 0 && value.every(jsonLdBlockOk);
    }
    if (!value || typeof value !== 'object') {
        return false;
    }
    const record = value as Record<string, unknown>;
    if (record['@context'] === undefined) {
        return false;
    }
    if (Array.isArray(record['@graph'])) {
        return record['@graph'].every((node) => isTypedNode(node));
    }
    return record['@type'] !== undefined;
}

function isTypedNode(value: unknown): boolean {
    return typeof value === 'object' && value !== null && '@type' in value;
}

function jsonLdNodes(value: unknown): Record<string, unknown>[] {
    if (Array.isArray(value)) {
        return value.flatMap(jsonLdNodes);
    }
    if (!value || typeof value !== 'object') {
        return [];
    }
    const record = value as Record<string, unknown>;
    if (Array.isArray(record['@graph'])) {
        return record['@graph'].flatMap(jsonLdNodes);
    }
    return [record];
}

function isDatasetType(value: unknown): boolean {
    if (value === 'Dataset') {
        return true;
    }
    return Array.isArray(value) && value.includes('Dataset');
}

function jsonLdIssues(parsed: ParsedPage): AuditIssue[] {
    const invalid = parsed.jsonLd.filter((block) => {
        try {
            return !jsonLdBlockOk(JSON.parse(block));
        } catch {
            return true;
        }
    });
    const issues: AuditIssue[] = [];
    if (invalid.length > 0) {
        issues.push(issue('common.jsonld-valid', `${invalid.length} JSON-LD block(s) are invalid`));
    }
    for (const block of parsed.jsonLd) {
        let parsedBlock: unknown;
        try {
            parsedBlock = JSON.parse(block);
        } catch {
            continue;
        }
        for (const node of jsonLdNodes(parsedBlock)) {
            if (!isDatasetType(node['@type'])) {
                continue;
            }
            const description = node.description;
            if (typeof description !== 'string' || description.trim().length === 0) {
                issues.push(issue('common.jsonld-dataset-description', 'Dataset JSON-LD is missing description'));
            }
        }
    }
    return issues;
}

function assetIssues(parsed: ParsedPage, ctx: RuleContext): AuditIssue[] {
    const prefixes = parsed.nextStaticPrefixes;
    if (prefixes.length > 1) {
        return [issue('common.assets-single-build', `multiple build prefixes: ${prefixes.join(', ')}`)];
    }
    const prefix = prefixes[0];
    if (ctx.buildPrefix && prefix && prefix !== ctx.buildPrefix) {
        return [issue('common.assets-single-build', `asset prefix ${prefix} is not ${ctx.buildPrefix}`)];
    }
    return [];
}

export function applyCommonRules(page: PageAudit, ctx: RuleContext): AuditIssue[] {
    const issues: AuditIssue[] = [];
    if (page.discoveredVia === 'sitemap' && page.status !== 200) {
        issues.push(issue('common.http-status', `sitemap URL returned HTTP ${page.status}`));
    }
    const parsed = page.parsed;
    if (page.status !== 200 || !parsed) {
        return issues;
    }
    if (parsed.htmlLang !== page.locale) {
        issues.push(issue('common.html-lang', `html lang "${parsed.htmlLang ?? ''}" is not ${page.locale}`));
    }
    if (parsed.titles.length !== 1) {
        issues.push(issue('common.single-title', `found ${parsed.titles.length} title elements`));
    }
    if (!parsed.hasViewport) {
        issues.push(issue('common.viewport', 'viewport meta is missing'));
    }
    issues.push(...assetIssues(parsed, ctx));
    issues.push(...jsonLdIssues(parsed));
    return issues;
}
