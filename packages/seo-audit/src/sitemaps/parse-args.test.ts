import { describe, expect, it } from 'vitest';

import { parseSeoValidateArgs } from './parse-args.js';
import type { SeoValidateArgs } from './types.js';

describe('parseSeoValidateArgs', () => {
    it('reads the base URL and defaults sample to 20', () => {
        expect(parseSeoValidateArgs(['https://www.example.com/'])).toEqual({
            baseUrl: 'https://www.example.com',
            secret: undefined,
            sample: 20,
        } satisfies SeoValidateArgs);
    });

    it('falls back to SITEMAP_SECRET and accepts --sample all', () => {
        expect(parseSeoValidateArgs(['http://localhost:3064', '--sample', 'all'], 'token-from-env')).toEqual({
            baseUrl: 'http://localhost:3064',
            secret: 'token-from-env',
            sample: 'all',
        } satisfies SeoValidateArgs);
    });

    it('ignores a pnpm -- separator before the base URL', () => {
        expect(parseSeoValidateArgs(['--', 'http://localhost:3064'])).toEqual({
            baseUrl: 'http://localhost:3064',
            secret: undefined,
            sample: 20,
        } satisfies SeoValidateArgs);
    });

    it('lets --secret override the env fallback', () => {
        expect(
            parseSeoValidateArgs(['https://www.example.com', '--secret', 'cli-token', '--sample', '5'], 'env-token'),
        ).toEqual({
            baseUrl: 'https://www.example.com',
            secret: 'cli-token',
            sample: 5,
        } satisfies SeoValidateArgs);
    });

    it('throws when the base URL is missing', () => {
        expect(() => parseSeoValidateArgs([])).toThrow(/missing required argument 'baseUrl'/);
    });

    it('throws on an unknown flag', () => {
        expect(() => parseSeoValidateArgs(['https://www.example.com', '--nope'])).toThrow(/unknown option '--nope'/);
    });
});
