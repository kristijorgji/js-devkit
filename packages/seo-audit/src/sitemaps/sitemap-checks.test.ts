import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { checkSitemapLocs, parseSitemapXml, validateSitemapSchema } from './sitemap-checks.js';
import type { SitemapUrlRecord } from './types.js';

const fixturesDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), './__fixtures__');
const ORIGIN = 'https://example.com';

function readFixture(name: string): string {
    return readFileSync(path.join(fixturesDir, name), 'utf8');
}

describe('sitemap-checks', () => {
    it('accepts a urlset that matches the official XSD', async () => {
        const xml = readFixture('urlset-minimal.xml');
        const schema = await validateSitemapSchema(xml);
        expect(schema.ok).toBe(true);
        expect(parseSitemapXml(xml).urls.map((row) => row.loc)).toEqual([`${ORIGIN}/en`]);
    });

    it('accepts a sitemapindex that matches the official XSD', async () => {
        const xml = readFixture('sitemapindex.xml');
        const schema = await validateSitemapSchema(xml);
        expect(schema.ok).toBe(true);
        expect(parseSitemapXml(xml).kind).toBe('sitemapindex');
    });

    it('rejects a relative loc, a foreign host, a future lastmod, and duplicates', () => {
        const urls: SitemapUrlRecord[] = [
            { loc: '/en' },
            { loc: 'https://evil.example/en' },
            { loc: `${ORIGIN}/en`, lastmod: '2099-01-01T00:00:00.000Z' },
            { loc: `${ORIGIN}/en/properties` },
            { loc: `${ORIGIN}/en/properties` },
        ];
        const result = checkSitemapLocs(urls, ORIGIN, Date.parse('2026-10-18T00:00:00.000Z'));
        expect(result.ok).toBe(false);
        expect(result.messages.join('\n')).toMatch(/invalid loc \/en/);
        expect(result.messages.join('\n')).toMatch(/not same-origin/);
        expect(result.messages.join('\n')).toMatch(/1 day in the future/);
        expect(result.messages.join('\n')).toMatch(/duplicate loc/);
    });
});
