import { describe, expect, it } from 'vitest';

import { formatPageRendering, parseRouteSource } from './parse-route-source.js';

describe('parseRouteSource', () => {
    it('detects revalidate and generateStaticParams', () => {
        const parsed = parseRouteSource(`
            export const revalidate = 86400;
            export async function generateStaticParams() { return []; }
        `);
        expect(parsed.revalidateSeconds).toBe(86400);
        expect(parsed.hasGenerateStaticParams).toBe(true);
        expect(formatPageRendering(parsed)).toBe('Build-time SSG + ISR (86400s)');
    });

    it('detects sync generateStaticParams', () => {
        const parsed = parseRouteSource(`export function generateStaticParams() { return []; }`);
        expect(parsed.hasGenerateStaticParams).toBe(true);
        expect(formatPageRendering(parsed)).toBe('Build-time SSG');
    });

    it('detects on-demand ISR without generateStaticParams', () => {
        const parsed = parseRouteSource(`export const revalidate = 3600;`);
        expect(formatPageRendering(parsed)).toBe('On-demand ISR (3600s)');
    });

    it('does not let revalidate mask searchParams', () => {
        const parsed = parseRouteSource(`
            export const revalidate = 300;
            interface Props { searchParams: Promise<Record<string, string>>; }
        `);
        expect(formatPageRendering(parsed)).toBe('Dynamic (searchParams)');
    });

    it('detects cookies/headers', () => {
        const parsed = parseRouteSource(`const h = await headers();`);
        expect(parsed.hasDynamicApis).toBe(true);
        expect(formatPageRendering(parsed)).toBe('Dynamic (cookies/headers)');
    });

    it('ignores headers() mentioned in comments', () => {
        const parsed = parseRouteSource(`
            /** Avoid headers() here so public pages stay cacheable. */
            export const revalidate = 3600;
        `);
        expect(parsed.hasDynamicApis).toBe(false);
        expect(formatPageRendering(parsed)).toBe('On-demand ISR (3600s)');
    });
});
