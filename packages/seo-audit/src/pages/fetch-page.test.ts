// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';

import { createPool, fetchPage } from './fetch-page.js';

const USER_AGENT = 'test-agent';

describe('fetchPage', () => {
    it('does not follow redirects and sends the audit user agent', async () => {
        const fetchImpl = vi.fn(
            async () => new Response('<html></html>', { status: 302, headers: { location: '/en' } }),
        );
        const page = await fetchPage('https://www.example.com/en', fetchImpl, USER_AGENT);
        expect(page.status).toBe(302);
        expect(page.location).toBe('/en');
        expect(fetchImpl).toHaveBeenCalledWith(
            'https://www.example.com/en',
            expect.objectContaining({
                redirect: 'manual',
                headers: expect.objectContaining({ 'user-agent': USER_AGENT }),
            }),
        );
    });

    it('retries once after a 503', async () => {
        vi.useFakeTimers();
        let calls = 0;
        const fetchImpl = vi.fn(async () => {
            calls += 1;
            if (calls === 1) {
                return new Response('unavailable', { status: 503 });
            }
            return new Response('<html></html>', { status: 200, headers: { 'content-type': 'text/html' } });
        });
        const pending = fetchPage('https://www.example.com/en', fetchImpl, USER_AGENT);
        await vi.runAllTimersAsync();
        const page = await pending;
        expect(page.status).toBe(200);
        expect(fetchImpl).toHaveBeenCalledTimes(2);
        vi.useRealTimers();
    });
});

describe('createPool', () => {
    it('runs at most the given number of tasks at once', async () => {
        const pool = createPool(1);
        const order: string[] = [];
        const first = pool(async () => {
            order.push('first-start');
            await Promise.resolve();
            order.push('first-end');
        });
        const second = pool(async () => {
            order.push('second');
        });
        await Promise.all([first, second]);
        expect(order).toEqual(['first-start', 'first-end', 'second']);
    });
});
