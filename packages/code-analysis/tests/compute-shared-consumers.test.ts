import { describe, expect, it } from 'vitest';

import { computeSharedConsumers } from '../src/analyzers/shared-consumers/compute-shared-consumers.js';

function sorted(map: Map<string, Set<string>>): Record<string, string[]> {
    return Object.fromEntries([...map.entries()].map(([file, consumers]) => [file, [...consumers].sort()]));
}

describe('computeSharedConsumers', () => {
    it('adds an importer\'s consumers onto its dependencies', () => {
        const direct = new Map<string, Set<string>>([
            ['src/alpha-one.ts', new Set(['apps/one', 'apps/two'])],
            ['src/helper.ts', new Set()],
        ]);
        const result = computeSharedConsumers(direct, [{ importer: 'src/alpha-one.ts', dependency: 'src/helper.ts' }]);
        expect(sorted(result)).toEqual({
            'src/alpha-one.ts': ['apps/one', 'apps/two'],
            'src/helper.ts': ['apps/one', 'apps/two'],
        });
    });

    it('is cycle-safe', () => {
        const direct = new Map<string, Set<string>>([
            ['src/a.ts', new Set(['apps/one'])],
            ['src/b.ts', new Set()],
        ]);
        const result = computeSharedConsumers(direct, [
            { importer: 'src/a.ts', dependency: 'src/b.ts' },
            { importer: 'src/b.ts', dependency: 'src/a.ts' },
        ]);
        expect(sorted(result)).toEqual({
            'src/a.ts': ['apps/one'],
            'src/b.ts': ['apps/one'],
        });
    });
});
