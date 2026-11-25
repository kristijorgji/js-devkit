import type { SizeLimitRule } from '@kristijorgji/eslint-plugin';

const LINES_RE = /too many lines \((\d+)\)/;
const COGNITIVE_RE = /Cognitive Complexity from (\d+) to/;

export interface SizeViolation {
    rule: SizeLimitRule;
    value: number;
}

export function parseSizeViolation(message: { ruleId: string | null; message: string }): SizeViolation | null {
    if (message.ruleId === 'max-lines' || message.ruleId === 'max-lines-per-function') {
        const match = LINES_RE.exec(message.message);
        return match ? { rule: message.ruleId, value: Number(match[1]) } : null;
    }
    if (message.ruleId === 'sonarjs/cognitive-complexity') {
        const match = COGNITIVE_RE.exec(message.message);
        return match ? { rule: message.ruleId, value: Number(match[1]) } : null;
    }
    return null;
}
