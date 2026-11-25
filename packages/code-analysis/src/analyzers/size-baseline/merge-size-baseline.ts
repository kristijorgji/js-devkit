import { SIZE_LIMIT_RULES, type SizeLimitRule, type SizeLimitsBaseline } from '@kristijorgji/eslint-plugin';

export interface SizeBaselineChange {
    file: string;
    rule: SizeLimitRule;
    from?: number;
    to?: number;
}

export interface MergeSizeBaselineResult {
    next: SizeLimitsBaseline;
    added: SizeBaselineChange[];
    increased: SizeBaselineChange[];
    decreased: SizeBaselineChange[];
    removed: SizeBaselineChange[];
}

export function mergeSizeBaseline(
    existing: SizeLimitsBaseline,
    current: SizeLimitsBaseline
): MergeSizeBaselineResult {
    const next: SizeLimitsBaseline = {};
    const added: SizeBaselineChange[] = [];
    const increased: SizeBaselineChange[] = [];
    const decreased: SizeBaselineChange[] = [];
    const removed: SizeBaselineChange[] = [];

    const files = [...new Set([...Object.keys(existing), ...Object.keys(current)])].sort();
    for (const file of files) {
        const currentEntry = current[file];
        const existingEntry = existing[file];
        if (currentEntry) {
            const nextEntry: Partial<Record<SizeLimitRule, number>> = {};
            for (const rule of SIZE_LIMIT_RULES) {
                const currentValue = currentEntry[rule];
                const existingValue = existingEntry?.[rule];
                if (currentValue === undefined) {
                    if (existingValue !== undefined) {
                        removed.push({ file, rule, from: existingValue });
                    }
                    continue;
                }
                nextEntry[rule] = currentValue;
                if (existingValue === undefined) {
                    added.push({ file, rule, to: currentValue });
                } else if (currentValue > existingValue) {
                    increased.push({ file, rule, from: existingValue, to: currentValue });
                } else if (currentValue < existingValue) {
                    decreased.push({ file, rule, from: existingValue, to: currentValue });
                }
            }
            next[file] = nextEntry;
        } else if (existingEntry) {
            for (const rule of SIZE_LIMIT_RULES) {
                const existingValue = existingEntry[rule];
                if (existingValue !== undefined) {
                    removed.push({ file, rule, from: existingValue });
                }
            }
        }
    }

    return { next, added, increased, decreased, removed };
}
