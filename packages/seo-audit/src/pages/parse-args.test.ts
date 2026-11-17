// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { INDEXABLE, SUPPORTED } from './__fixtures__/pages.js';
import { parseSeoAuditArgs } from './parse-args.js';
import type { SeoAuditArgs } from './types.js';

const locales = {
    supported: SUPPORTED,
    indexable: INDEXABLE,
    default: 'en',
};

describe('parseSeoAuditArgs', () => {
    it('applies defaults and strips a trailing slash', () => {
        expect(parseSeoAuditArgs(['https://www.example.com/'], undefined, locales)).toEqual({
            baseUrl: 'https://www.example.com',
            secret: undefined,
            maxUrls: 500,
            crawlDepth: 2,
            concurrency: 4,
            locales: ['en', 'sq', 'de', 'it', 'mk'],
            lighthouse: 0,
            failOn: 'error',
        } satisfies SeoAuditArgs);
    });

    it('ignores a pnpm -- separator', () => {
        expect(parseSeoAuditArgs(['--', 'http://localhost:3116'], undefined, locales).baseUrl).toBe(
            'http://localhost:3116',
        );
    });

    it('rejects a non-positive max-urls', () => {
        expect(() => parseSeoAuditArgs(['https://www.example.com', '--max-urls', '0'], undefined, locales)).toThrow(
            /positive integer/,
        );
    });

    it('rejects an unknown locale', () => {
        expect(() => parseSeoAuditArgs(['https://www.example.com', '--locales', 'zz'], undefined, locales)).toThrow(
            /unknown locales/,
        );
    });
});
