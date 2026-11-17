import { readFileSync } from 'node:fs';

import { cliLogger } from '@kristijorgji/cli-kit';

import { parseRoutesDocument } from './classify-route.js';
import type { ResolvedSeoAuditConfig } from '../config/types.js';
import { parseSeoAuditArgs } from './parse-args.js';
import { auditShouldFail, summaryLines } from './report-json.js';
import { runSeoAudit } from './run-audit.js';

export async function runPagesAudit(argv: string[], config: ResolvedSeoAuditConfig): Promise<boolean> {
    const args = parseSeoAuditArgs(argv, config.secretEnv ? process.env[config.secretEnv] : undefined, config.locales);
    const routes = config.routesFile
        ? parseRoutesDocument(readFileSync(config.routesFile, 'utf8'))
        : { appPages: [] };
    const { report, jsonPath, htmlPath } = await runSeoAudit({ args, routes, config });
    for (const line of summaryLines(report)) {
        cliLogger.info(line);
    }
    cliLogger.info(jsonPath);
    cliLogger.info(htmlPath);
    return auditShouldFail(report, args.failOn);
}
