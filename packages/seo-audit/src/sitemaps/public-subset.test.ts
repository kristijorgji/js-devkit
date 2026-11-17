import { describe, expect, it } from 'vitest';

import { checkPublicSubset } from './public-subset.js';

describe('checkPublicSubset', () => {
    it('passes when every public loc is in the secret set', () => {
        expect(
            checkPublicSubset(
                ['https://example.com/en', 'https://example.com/en/properties'],
                [
                    'https://example.com/en/properties',
                    'https://example.com/en',
                    'https://example.com/en/listings/secret',
                ],
            ).ok,
        ).toBe(true);
    });

    it('fails when a public loc is missing', () => {
        const result = checkPublicSubset(['https://example.com/en/privacy'], ['https://example.com/en']);
        expect(result.ok).toBe(false);
        expect(result.messages[0]).toMatch(/privacy/);
    });
});
