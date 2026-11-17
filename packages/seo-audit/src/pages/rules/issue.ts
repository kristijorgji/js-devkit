import type { AuditIssue } from '../types.js';

import { type RuleId, RULES } from './catalog.js';

export function issue(ruleId: RuleId, message: string): AuditIssue {
    return { ruleId, severity: RULES[ruleId].severity, message };
}
