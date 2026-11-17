import type { WebRoutesDocument } from './classify-route.js';
import type { CoverageCell, PageAudit, SeoAuditReport } from './types.js';

function emptyCell(): CoverageCell {
    return { indexable: 0, noindex: 0, errors: 0, warns: 0 };
}

export function buildCoverage(
    pages: readonly PageAudit[],
    routes: WebRoutesDocument,
): { coverage: SeoAuditReport['coverage']; uncoveredRoutes: string[] } {
    const coverage: SeoAuditReport['coverage'] = {};
    for (const page of pages) {
        const byLocale = coverage[page.routeName] ?? {};
        const cell = byLocale[page.locale] ?? emptyCell();
        if (page.indexable) {
            cell.indexable += 1;
        } else {
            cell.noindex += 1;
        }
        for (const item of page.issues) {
            if (item.severity === 'error') {
                cell.errors += 1;
            } else if (item.severity === 'warn') {
                cell.warns += 1;
            }
        }
        byLocale[page.locale] = cell;
        coverage[page.routeName] = byLocale;
    }
    const sampled = new Set(pages.map((page) => page.routeName));
    const uncoveredRoutes = routes.appPages
        .filter((page) => page.indexable === 'Yes' && !sampled.has(page.routeName))
        .map((page) => page.routeName);
    return { coverage, uncoveredRoutes };
}
