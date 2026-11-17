// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';

import { cliLogger } from '@kristijorgji/cli-kit';

import { indexableAudit } from './__fixtures__/pages.js';
import { type LighthouseScores, mapLighthouseScores, pickLighthouseUrls, runLighthouse } from './lighthouse.js';
import type { PageAudit } from './types.js';

describe('lighthouse helpers', () => {
    it('maps category scores to 0-100', () => {
        expect(
            mapLighthouseScores({
                seo: { score: 0.92 },
                performance: { score: 0.5 },
                accessibility: { score: 1 },
                'best-practices': { score: null },
            }),
        ).toEqual({ seo: 92, performance: 50, accessibility: 100, bestPractices: 0 } satisfies LighthouseScores);
    });

    it('picks the first indexable URL per route name, then fills up to n', () => {
        const pages: PageAudit[] = [
            indexableAudit({ url: 'https://www.example.com/en/b', routeName: 'b' }),
            indexableAudit({ url: 'https://www.example.com/en/a', routeName: 'a' }),
            indexableAudit({ url: 'https://www.example.com/en/b2', routeName: 'b' }),
            indexableAudit({ url: 'https://www.example.com/en/hidden', routeName: 'hidden', indexable: false }),
        ];
        expect(pickLighthouseUrls(pages, 2)).toEqual([
            'https://www.example.com/en/a',
            'https://www.example.com/en/b',
        ]);
        expect(pickLighthouseUrls(pages, 3)).toEqual([
            'https://www.example.com/en/a',
            'https://www.example.com/en/b',
            'https://www.example.com/en/b2',
        ]);
    });

    it('returns an empty map and warns when the runner throws', async () => {
        const warn = vi.spyOn(cliLogger, 'warn').mockImplementation(() => undefined);
        const scores = await runLighthouse(['https://www.example.com/en'], async () => {
            throw new Error('no chrome');
        });
        expect(scores.size).toBe(0);
        expect(warn).toHaveBeenCalledWith(expect.stringContaining('Lighthouse skipped: no chrome'));
        warn.mockRestore();
    });
});
