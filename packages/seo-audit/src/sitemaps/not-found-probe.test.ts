import { describe, expect, it, vi } from 'vitest';

import { checkNotFoundStatus, probeNotFoundPages } from './not-found-probe.js';

const SEO_VALIDATE_UNKNOWN_PATH = '/en/__seo-validate-404__/x';

describe('not-found-probe', () => {
    it('passes only HTTP 404', () => {
        expect(checkNotFoundStatus('/en/missing', 404).ok).toBe(true);
        expect(checkNotFoundStatus('/en/missing', 200).ok).toBe(false);
    });

    it('probes the unknown path and unknown market slug', async () => {
        const paths = [SEO_VALIDATE_UNKNOWN_PATH, '/en/country/city/__x__'];
        const fetchImpl = vi.fn(async (input: Parameters<typeof fetch>[0]) => {
            const url = String(input);
            return { status: url.includes(SEO_VALIDATE_UNKNOWN_PATH) ? 404 : 200 } satisfies Pick<Response, 'status'>;
        }) as unknown as typeof fetch;
        const results = await probeNotFoundPages('https://example.com', paths, fetchImpl);
        expect(results).toHaveLength(2);
        expect(results[0]?.ok).toBe(true);
        expect(results[1]?.ok).toBe(false);
    });
});
