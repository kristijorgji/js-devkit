import { describe, expect, it } from 'vitest';

import { assertSizeLimitRowsMeasured, parseSizeLimitJsonRows } from './collect-size-limit-budgets.js';

describe('parseSizeLimitJsonRows', () => {
    it('extracts the JSON array from mixed stdout', () => {
        const rows = parseSizeLimitJsonRows('warn\n[{"name":"A","passed":true,"size":10,"sizeLimit":20}]\n');
        expect(rows).toEqual([{ name: 'A', passed: true, size: 10, sizeLimit: 20 }]);
    });
});

describe('assertSizeLimitRowsMeasured', () => {
    it('fails when any budget reports size 0', () => {
        expect(() =>
            assertSizeLimitRowsMeasured([
                { name: 'Edge middleware', passed: true, size: 0, sizeLimit: 100 },
                { name: 'Service worker', passed: true, size: 12, sizeLimit: 20 },
            ]),
        ).toThrow('Size-limit budgets measured 0 bytes: Edge middleware');
    });
});
