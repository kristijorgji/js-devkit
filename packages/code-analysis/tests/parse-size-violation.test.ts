import { describe, expect, it } from 'vitest';

import { parseSizeViolation } from '../src/analyzers/size-baseline/parse-size-violation.js';

describe('parseSizeViolation', () => {
    it('parses max-lines', () => {
        expect(
            parseSizeViolation({
                ruleId: 'max-lines',
                message: 'File has too many lines (1354). Maximum allowed is 300.',
            })
        ).toEqual({ rule: 'max-lines', value: 1354 });
    });

    it('parses max-lines-per-function', () => {
        expect(
            parseSizeViolation({
                ruleId: 'max-lines-per-function',
                message: "Function 'processUrlBody' has too many lines (247). Maximum allowed is 80.",
            })
        ).toEqual({ rule: 'max-lines-per-function', value: 247 });
    });

    it('parses sonarjs/cognitive-complexity', () => {
        expect(
            parseSizeViolation({
                ruleId: 'sonarjs/cognitive-complexity',
                message: 'Refactor this function to reduce its Cognitive Complexity from 34 to the 20 allowed.',
            })
        ).toEqual({ rule: 'sonarjs/cognitive-complexity', value: 34 });
    });

    it('returns null for a non-matching rule', () => {
        expect(parseSizeViolation({ ruleId: 'no-console', message: 'Unexpected console statement.' })).toBeNull();
    });
});
