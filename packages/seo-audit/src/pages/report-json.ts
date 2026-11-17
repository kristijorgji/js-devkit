import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import type { WebRoutesDocument } from './classify-route.js';
import { buildCoverage } from './coverage.js';
import { renderReportHtml } from './report-html.js';
import type { PageAudit, SeoAuditArgs, SeoAuditReport, Severity } from './types.js';

const SEVERITY_RANK: Record<Severity, number> = { info: 0, warn: 1, error: 2 };

export function buildReport(input: {
    pages: PageAudit[];
    routes: WebRoutesDocument;
    baseUrl: string;
    buildPrefix?: string;
    generatedAt?: string;
}): SeoAuditReport {
    const { coverage, uncoveredRoutes } = buildCoverage(input.pages, input.routes);
    const summary: SeoAuditReport['summary'] = {
        urls: input.pages.length,
        indexable: 0,
        noindex: 0,
        errors: 0,
        warns: 0,
        infos: 0,
    };
    for (const page of input.pages) {
        if (page.indexable) {
            summary.indexable += 1;
        } else {
            summary.noindex += 1;
        }
        for (const item of page.issues) {
            if (item.severity === 'error') {
                summary.errors += 1;
            } else if (item.severity === 'warn') {
                summary.warns += 1;
            } else {
                summary.infos += 1;
            }
        }
    }
    return {
        generatedAt: input.generatedAt ?? new Date().toISOString(),
        baseUrl: input.baseUrl,
        ...(input.buildPrefix ? { buildPrefix: input.buildPrefix } : {}),
        summary,
        coverage,
        uncoveredRoutes,
        pages: input.pages,
    };
}

export function writeReport(outDir: string, report: SeoAuditReport): { jsonPath: string; htmlPath: string } {
    mkdirSync(outDir, { recursive: true });
    const jsonPath = path.join(outDir, 'report.json');
    const htmlPath = path.join(outDir, 'report.html');
    writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
    writeFileSync(htmlPath, renderReportHtml(report));
    return { jsonPath, htmlPath };
}

export function summaryLines(report: SeoAuditReport): string[] {
    const counts = new Map<string, number>();
    for (const page of report.pages) {
        for (const item of page.issues) {
            counts.set(item.ruleId, (counts.get(item.ruleId) ?? 0) + 1);
        }
    }
    const top = [...counts.entries()]
        .sort((left, right) => right[1] - left[1])
        .slice(0, 10)
        .map(([ruleId, count]) => `${count} ${ruleId}`);
    const { summary } = report;
    return [
        `urls=${summary.urls} indexable=${summary.indexable} noindex=${summary.noindex} errors=${summary.errors} warns=${summary.warns} infos=${summary.infos}`,
        ...top,
    ];
}

export function auditShouldFail(report: SeoAuditReport, failOn: SeoAuditArgs['failOn']): boolean {
    if (failOn === 'none') {
        return false;
    }
    const threshold = SEVERITY_RANK[failOn];
    return report.pages.some((page) => page.issues.some((item) => SEVERITY_RANK[item.severity] >= threshold));
}
