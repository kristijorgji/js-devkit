import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { resolveRouteDocsConfig } from '../config/load-config.js';
import type { RouteDocsConfig } from '../config/types.js';

const FIXTURES = dirname(fileURLToPath(import.meta.url));

export const FIXTURE_APP_ROOT = FIXTURES;

const PAGE_NAMES: Record<string, string> = {
    '[locale]/page.tsx': 'home',
    '[locale]/posts/page.tsx': 'posts',
    '[locale]/posts/[slug]/page.tsx': 'post',
    '[locale]/(auth)/login/page.tsx': 'login',
    '[locale]/(dashboard)/dashboard/page.tsx': 'dashboard',
};

const LOCALIZED: Record<string, Record<string, string>> = {
    posts: { en: '/posts', de: '/beitraege' },
    post: { en: '/posts/[slug]', de: '/beitraege/[slug]' },
};

export function fixtureConfig(overrides: Partial<RouteDocsConfig> = {}) {
    return resolveRouteDocsConfig({
        appRoot: FIXTURE_APP_ROOT,
        appDir: join(FIXTURE_APP_ROOT, 'app'),
        publicDir: join(FIXTURE_APP_ROOT, 'public'),
        distDir: join(FIXTURE_APP_ROOT, 'next15/.next'),
        resolveRouteName: (sourcePath) => PAGE_NAMES[sourcePath] ?? null,
        resolveLocalizedPath: (routeName, locale) => LOCALIZED[routeName]?.[locale] ?? null,
        resolveAuth: (route) => {
            if (route.kind === 'page' && route.sourcePath.includes('/(dashboard)/')) return 'JWT';
            if (route.kind === 'page' && route.sourcePath.includes('/(auth)/')) return 'Guest';
            return null;
        },
        describe: (key) => {
            const summaries: Record<string, string> = {
                home: 'Marketing home',
                posts: 'Post listing',
                post: 'Post detail',
                login: 'Sign in',
                dashboard: 'Private dashboard',
            };
            return summaries[key] ? { summary: summaries[key] } : undefined;
        },
        locales: ['en', 'de'],
        ...overrides,
    });
}
