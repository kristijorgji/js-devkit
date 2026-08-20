import { describe, expect, it } from 'vitest';

import type { BundleHistoryEntry, BundleSnapshot } from '../snapshot/types.js';

import { computeBudgetDeltas, computeRouteMovers } from './compute-diff.js';
import { findBaselineEntry, findPreviousEntry } from './load.js';
import { upsertHistoryEntry } from './save.js';

function createSnapshot(overrides: Partial<BundleSnapshot> = {}): BundleSnapshot {
    return {
        commitSha: 'abc123',
        author: 'dev@example.com',
        commitMessage: 'feat: bundle',
        branch: 'main',
        timestamp: '2026-01-01T00:00:00.000Z',
        budgets: [
            {
                name: 'Service worker',
                sizeBytes: 1000,
                limitBytes: 12000,
                passed: true,
            },
        ],
        routes: [
            {
                route: '/[locale]/dashboard/analytics',
                firstLoadUncompressedJsBytes: 100_000,
                firstLoadChunkPaths: [],
            },
        ],
        ...overrides,
    };
}

describe('computeBudgetDeltas', () => {
    it('computes deltas against the previous snapshot', () => {
        const baseline = createSnapshot({
            budgets: [
                {
                    name: 'Service worker',
                    sizeBytes: 1000,
                    limitBytes: 12000,
                    passed: true,
                },
            ],
        });
        const current = createSnapshot({
            budgets: [
                {
                    name: 'Service worker',
                    sizeBytes: 1500,
                    limitBytes: 12000,
                    passed: true,
                },
            ],
        });

        expect(computeBudgetDeltas(baseline, current)).toEqual([
            {
                name: 'Service worker',
                baselineBytes: 1000,
                currentBytes: 1500,
                deltaBytes: 500,
                limitBytes: 12000,
            },
        ]);
    });
});

describe('computeRouteMovers', () => {
    it('returns only movers above the threshold', () => {
        const baseline = createSnapshot({
            routes: [
                {
                    route: '/[locale]/dashboard/analytics',
                    firstLoadUncompressedJsBytes: 100_000,
                    firstLoadChunkPaths: [],
                },
            ],
        });
        const current = createSnapshot({
            routes: [
                {
                    route: '/[locale]/dashboard/analytics',
                    firstLoadUncompressedJsBytes: 102_500,
                    firstLoadChunkPaths: [],
                },
            ],
        });

        expect(computeRouteMovers(baseline, current)).toHaveLength(1);
        expect(computeRouteMovers(baseline, current)[0]?.deltaBytes).toBe(2500);
    });
});

describe('findBaselineEntry', () => {
    it('reuses the stored snapshot when the same commit is tracked again', () => {
        const history: BundleHistoryEntry[] = [{ ...createSnapshot({ commitSha: 'same-sha' }), comparison: null }];

        expect(findBaselineEntry(history, 'same-sha')?.commitSha).toBe('same-sha');
    });
});

describe('findPreviousEntry', () => {
    it('skips the current commit when selecting a baseline', () => {
        const history: BundleHistoryEntry[] = [
            { ...createSnapshot({ commitSha: '111' }), comparison: null },
            { ...createSnapshot({ commitSha: '222' }), comparison: null },
        ];

        expect(findPreviousEntry(history, '222')?.commitSha).toBe('111');
        expect(findPreviousEntry(history, '333')?.commitSha).toBe('222');
    });
});

describe('upsertHistoryEntry', () => {
    it('replaces an existing commit instead of appending duplicates', () => {
        const first: BundleHistoryEntry = {
            ...createSnapshot({ commitSha: 'same-sha', budgets: [] }),
            comparison: null,
        };
        const second: BundleHistoryEntry = {
            ...createSnapshot({
                commitSha: 'same-sha',
                budgets: [
                    {
                        name: 'Service worker',
                        sizeBytes: 2000,
                        limitBytes: 12000,
                        passed: true,
                    },
                ],
            }),
            comparison: null,
        };

        const updated = upsertHistoryEntry([first], second);

        expect(updated).toHaveLength(1);
        expect(updated[0]?.budgets[0]?.sizeBytes).toBe(2000);
    });
});
