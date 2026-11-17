import type { PageAudit, Severity } from '../types.js';

import type { RuleId } from './catalog.js';

export function applyRuleOverrides(
    pages: PageAudit[],
    overrides: Partial<Record<RuleId, Severity | 'off'>>,
): void {
    for (const page of pages) {
        page.issues = page.issues.flatMap((item) => {
            const override = overrides[item.ruleId as RuleId];
            if (override === undefined) {
                return [item];
            }
            if (override === 'off') {
                return [];
            }
            return [{ ...item, severity: override }];
        });
    }
}
