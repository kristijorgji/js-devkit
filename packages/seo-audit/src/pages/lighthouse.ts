import { cliLogger } from '@kristijorgji/cli-kit';

import type { PageAudit } from './types.js';

export interface LighthouseScores {
    seo: number;
    performance: number;
    accessibility: number;
    bestPractices: number;
}

export type LighthouseBatchRunner = (urls: readonly string[]) => Promise<Map<string, LighthouseScores>>;

interface LighthouseCategory {
    score?: number | null;
}

export function mapLighthouseScores(categories: Record<string, LighthouseCategory> | undefined): LighthouseScores {
    const score = (id: string): number => Math.round((categories?.[id]?.score ?? 0) * 100);
    return {
        seo: score('seo'),
        performance: score('performance'),
        accessibility: score('accessibility'),
        bestPractices: score('best-practices'),
    };
}

export function pickLighthouseUrls(pages: readonly PageAudit[], limit: number): string[] {
    if (limit <= 0) {
        return [];
    }
    const indexable = pages.filter((page) => page.indexable);
    const picked: string[] = [];
    const seen = new Set<string>();
    const routes = [...new Set(indexable.map((page) => page.routeName))].sort();
    for (const routeName of routes) {
        const page = indexable.find((candidate) => candidate.routeName === routeName);
        if (!page || seen.has(page.url)) {
            continue;
        }
        picked.push(page.url);
        seen.add(page.url);
        if (picked.length >= limit) {
            return picked;
        }
    }
    for (const page of indexable) {
        if (seen.has(page.url)) {
            continue;
        }
        picked.push(page.url);
        seen.add(page.url);
        if (picked.length >= limit) {
            break;
        }
    }
    return picked;
}

async function defaultRunner(urls: readonly string[]): Promise<Map<string, LighthouseScores>> {
    const chromeLauncher = await import('chrome-launcher');
    const lighthouseModule = await import('lighthouse');
    const lighthouse = lighthouseModule.default;
    const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless=new'] });
    const scores = new Map<string, LighthouseScores>();
    try {
        for (const url of urls) {
            const result = await lighthouse(url, {
                port: chrome.port,
                output: 'json',
                onlyCategories: ['seo', 'performance', 'accessibility', 'best-practices'],
                formFactor: 'mobile',
                screenEmulation: { mobile: true, width: 412, height: 823, deviceScaleFactor: 1.75, disabled: false },
            });
            scores.set(url, mapLighthouseScores(result?.lhr.categories));
        }
    } finally {
        await chrome.kill();
    }
    return scores;
}

export async function runLighthouse(
    urls: readonly string[],
    runner: LighthouseBatchRunner = defaultRunner,
): Promise<Map<string, LighthouseScores>> {
    if (urls.length === 0) {
        return new Map();
    }
    try {
        return await runner(urls);
    } catch (error: unknown) {
        const reason = error instanceof Error ? error.message : String(error);
        cliLogger.warn(`Lighthouse skipped: ${reason}`);
        return new Map();
    }
}
