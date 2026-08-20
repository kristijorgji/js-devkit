import { describe, expect, it } from 'vitest';

import { applyBudgetUpdates, computeStaticLimitUpdates } from './sync-limits.js';

describe('computeStaticLimitUpdates', () => {
    it('suggests a lower cap when measured size plus headroom is below the current limit', () => {
        const updates = computeStaticLimitUpdates(
            [{ name: 'Next main', sizeBytes: 30_960, limitBytes: 38_000, passed: true }],
            { main: { limit: '38 KB' } },
        );
        expect(updates).toHaveLength(1);
        expect(updates[0]?.groupId).toBe('main');
    });

    it('returns no updates when the cap is already tight', () => {
        const updates = computeStaticLimitUpdates(
            [{ name: 'Next main', sizeBytes: 35_000, limitBytes: 36_000, passed: true }],
            { main: { limit: '36 KB' } },
        );
        expect(updates).toHaveLength(0);
    });
});

describe('applyBudgetUpdates', () => {
    it('writes structured JSON updates without raising other caps', () => {
        const next = applyBudgetUpdates(
            { groups: { main: { limit: '38 KB' } }, routes: { home: { limit: '10 KB' } } },
            [{ name: 'Next main', groupId: 'main', currentLimit: '38 KB', suggestedLimit: '36 KB', sizeBytes: 30_960 }],
            [],
        );
        expect(next.groups.main?.limit).toBe('36 KB');
        expect(next.routes.home?.limit).toBe('10 KB');
    });
});
