import { describe, expect, it } from 'vitest';

import { mergeSizeBaseline } from '../src/analyzers/size-baseline/merge-size-baseline.js';
import type { SizeLimitsBaseline } from '@kristijorgji/eslint-plugin';

describe('mergeSizeBaseline', () => {
    it('classifies added, increased, decreased, removed, and unchanged entries', () => {
        const existing: SizeLimitsBaseline = {
            'src/a.ts': { 'max-lines': 400, 'max-lines-per-function': 90 },
            'src/b.ts': { 'max-lines': 320 },
            'src/c.ts': { 'sonarjs/cognitive-complexity': 25 },
        };
        const current: SizeLimitsBaseline = {
            'src/a.ts': { 'max-lines': 350, 'max-lines-per-function': 90 },
            'src/b.ts': { 'max-lines': 330 },
            'src/d.ts': { 'max-lines': 310 },
        };

        const result = mergeSizeBaseline(existing, current);

        expect(result.next).toEqual({
            'src/a.ts': { 'max-lines': 350, 'max-lines-per-function': 90 },
            'src/b.ts': { 'max-lines': 330 },
            'src/d.ts': { 'max-lines': 310 },
        });
        expect(result.added).toEqual([{ file: 'src/d.ts', rule: 'max-lines', to: 310 }]);
        expect(result.increased).toEqual([{ file: 'src/b.ts', rule: 'max-lines', from: 320, to: 330 }]);
        expect(result.decreased).toEqual([{ file: 'src/a.ts', rule: 'max-lines', from: 400, to: 350 }]);
        expect(result.removed).toEqual([{ file: 'src/c.ts', rule: 'sonarjs/cognitive-complexity', from: 25 }]);
    });
});
