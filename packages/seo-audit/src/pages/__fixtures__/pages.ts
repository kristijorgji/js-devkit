// @vitest-environment node
import type { PageAudit, ParsedPage, RuleContext } from '../types.js';

export const SUPPORTED = ['en', 'sq', 'de', 'it', 'mk', 'sr'] as const;
export const INDEXABLE = ['en', 'sq', 'de', 'it', 'mk'] as const;

const TITLE = 'Example homes for sale and rent in Exampleland';
const DESCRIPTION =
    'Search apartments, houses, and land for sale and rent across Exampleland with photos, prices, and neighborhood guides.';

const HREFLANG: { lang: string; href: string }[] = [
    ...INDEXABLE.map((lang) => ({ lang, href: `https://www.example.com/${lang}` })),
    { lang: 'x-default', href: 'https://www.example.com/' },
];

export const auditContext: RuleContext = {
    locales: [...SUPPORTED],
    indexableLocales: [...INDEXABLE],
    baseUrl: 'https://www.example.com',
    buildPrefix: 'https://cdn.example.com/web/abc1234',
    secretMode: true,
    thresholds: { titleMin: 30, titleMax: 65, descriptionMin: 70, descriptionMax: 160 },
    requiredOpenGraph: ['og:title', 'og:description', 'og:url', 'og:image', 'og:type', 'og:site_name'],
};

export function indexableParsed(overrides: Partial<ParsedPage> = {}): ParsedPage {
    return {
        htmlLang: 'en',
        titles: [TITLE],
        metaDescription: DESCRIPTION,
        canonical: 'https://www.example.com/en',
        hreflang: HREFLANG,
        og: {
            'og:title': TITLE,
            'og:description': DESCRIPTION,
            'og:url': 'https://www.example.com/en',
            'og:image': 'https://cdn.example.com/og.png',
            'og:type': 'website',
            'og:site_name': 'Example',
        },
        twitter: { 'twitter:card': 'summary_large_image' },
        h1Count: 1,
        jsonLd: ['{"@context":"https://schema.org","@type":"WebSite","name":"Example"}'],
        hasViewport: true,
        nextStaticPrefixes: ['https://cdn.example.com/web/abc1234'],
        links: [],
        ...overrides,
    };
}

export function indexableAudit(
    overrides: Partial<PageAudit> = {},
    parsedOverrides: Partial<ParsedPage> = {},
): PageAudit {
    const parsed = overrides.parsed ?? indexableParsed(parsedOverrides);
    return {
        url: 'https://www.example.com/en',
        locale: 'en',
        routeName: 'home',
        status: 200,
        indexable: true,
        robotsSource: 'none',
        inSitemap: 'public',
        discoveredVia: 'sitemap',
        issues: [],
        ...overrides,
        parsed,
    };
}

interface PageHtmlOptions {
    locale?: string;
    title?: string;
    description?: string;
    canonical?: string;
    robots?: string;
    prefixes?: string[];
    h1Count?: number;
    viewport?: boolean;
    jsonLd?: string;
    links?: string[];
}

export function indexablePageHtml(options: PageHtmlOptions = {}): string {
    const locale = options.locale ?? 'en';
    const canonical = options.canonical ?? `https://www.example.com/${locale}`;
    const title = options.title ?? TITLE;
    const description = options.description ?? DESCRIPTION;
    const prefixes = options.prefixes ?? ['https://cdn.example.com/web/abc1234'];
    const hreflang = [
        ...INDEXABLE.map(
            (lang) => `<link rel="alternate" hreflang="${lang}" href="https://www.example.com/${lang}"/>`,
        ),
        '<link rel="alternate" hreflang="x-default" href="https://www.example.com/"/>',
    ].join('');
    const robots = options.robots ? `<meta name="robots" content="${options.robots}"/>` : '';
    const viewport =
        options.viewport === false ? '' : '<meta name="viewport" content="width=device-width, initial-scale=1"/>';
    const jsonLd = options.jsonLd ?? '{"@context":"https://schema.org","@type":"WebSite","name":"Example"}';
    const h1s = '<h1>Example</h1>'.repeat(options.h1Count ?? 1);
    const scripts = prefixes.map((prefix) => `<script src="${prefix}/_next/static/chunks/main.js"></script>`).join('');
    const links = (options.links ?? []).map((href) => `<a href="${href}">link</a>`).join('');
    return `<!doctype html><html lang="${locale}"><head><title>${title}</title>${robots}
<meta name="description" content="${description}"/>
<link rel="canonical" href="${canonical}"/>${hreflang}
<meta property="og:title" content="${title}"/>
<meta property="og:description" content="${description}"/>
<meta property="og:url" content="${canonical}"/>
<meta property="og:image" content="https://cdn.example.com/og.png"/>
<meta property="og:type" content="website"/>
<meta property="og:site_name" content="Example"/>
<meta name="twitter:card" content="summary_large_image"/>
${viewport}${scripts}
<script type="application/ld+json">${jsonLd}</script>
</head><body>${h1s}${links}</body></html>`;
}

export function noindexPageHtml(options: PageHtmlOptions = {}): string {
    return indexablePageHtml({ ...options, robots: options.robots ?? 'noindex,follow' });
}
