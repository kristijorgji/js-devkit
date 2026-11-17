import type { FetchedPage } from './types.js';

const RETRY_DELAY_MS = 1000;

function delay(ms: number): Promise<void> {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

async function readPage(url: string, fetchImpl: typeof fetch, userAgent: string): Promise<FetchedPage> {
    const started = Date.now();
    const response = await fetchImpl(url, {
        redirect: 'manual',
        headers: {
            'user-agent': userAgent,
            accept: 'text/html',
        },
    });
    return {
        url,
        status: response.status,
        location: response.headers.get('location'),
        robotsHeader: response.headers.get('x-robots-tag'),
        contentType: response.headers.get('content-type'),
        html: await response.text(),
        durationMs: Date.now() - started,
    };
}

export async function fetchPage(
    url: string,
    fetchImpl: typeof fetch = fetch,
    userAgent: string,
): Promise<FetchedPage> {
    try {
        const first = await readPage(url, fetchImpl, userAgent);
        if (first.status < 500) {
            return first;
        }
    } catch {
        // Retry a network error once.
    }
    await delay(RETRY_DELAY_MS);
    return readPage(url, fetchImpl, userAgent);
}

export function createPool(concurrency: number): <T>(task: () => Promise<T>) => Promise<T> {
    let active = 0;
    const waiting: (() => void)[] = [];

    function pump(): void {
        if (active >= concurrency) {
            return;
        }
        const next = waiting.shift();
        if (!next) {
            return;
        }
        active += 1;
        next();
    }

    return function run<T>(task: () => Promise<T>): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            waiting.push(() => {
                task()
                    .then(resolve, reject)
                    .finally(() => {
                        active -= 1;
                        pump();
                    });
            });
            pump();
        });
    };
}
