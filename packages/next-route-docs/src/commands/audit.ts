import { cliLogger } from '@kristijorgji/cli-kit';

import { auditCatalog } from '../catalog/audit.js';
import type { ResolvedRouteDocsConfig } from '../config/types.js';

export function runAudit(config: ResolvedRouteDocsConfig): void {
    const result = auditCatalog(config);
    if (result.skipped) {
        cliLogger.warn(`audit skipped: ${result.reason}`);
        return;
    }
    if (result.mismatches.length === 0) {
        cliLogger.info('Declared cacheable routes match prerender-manifest.json.');
        return;
    }
    for (const mismatch of result.mismatches) {
        cliLogger.error(mismatch);
    }
    process.exitCode = 1;
}
