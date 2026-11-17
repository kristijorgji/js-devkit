export interface SeoCheckResult {
    name: string;
    ok: boolean;
    messages: string[];
}

export interface SitemapUrlRecord {
    loc: string;
    lastmod?: string;
}

export interface SeoValidateArgs {
    baseUrl: string;
    secret?: string;
    sample: number | 'all';
}

export function checkPassed(name: string, messages: string[] = []): SeoCheckResult {
    return { name, ok: messages.length === 0, messages };
}

export function checkFailed(name: string, messages: string[]): SeoCheckResult {
    return { name, ok: false, messages };
}
