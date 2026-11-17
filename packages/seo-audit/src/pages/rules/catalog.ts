import type { Severity } from '../types.js';

export const RULES = {
    'common.html-lang': {
        severity: 'error',
        appliesTo: 'all',
        description: 'html lang equals the URL locale',
    },
    'common.single-title': {
        severity: 'error',
        appliesTo: 'all',
        description: 'the page has exactly one title element',
    },
    'common.viewport': {
        severity: 'warn',
        appliesTo: 'all',
        description: 'a viewport meta tag is present',
    },
    'common.assets-single-build': {
        severity: 'error',
        appliesTo: 'all',
        description: 'script and link URLs use a single /_next/static build prefix, matching the home page when known',
    },
    'common.jsonld-valid': {
        severity: 'error',
        appliesTo: 'all',
        description: 'each JSON-LD block parses and has @context and @type (arrays and @graph allowed)',
    },
    'common.jsonld-dataset-description': {
        severity: 'error',
        appliesTo: 'all',
        description: 'a Dataset JSON-LD node includes a non-empty description',
    },
    'common.http-status': {
        severity: 'error',
        appliesTo: 'all',
        description: 'a sitemap URL returns HTTP 200, not a redirect',
    },
    'idx.title-present': { severity: 'error', appliesTo: 'indexable', description: 'indexable page has a title' },
    'idx.title-length': {
        severity: 'warn',
        appliesTo: 'indexable',
        description: 'title length is between 30 and 65 characters',
    },
    'idx.description-present': {
        severity: 'error',
        appliesTo: 'indexable',
        description: 'indexable page has a meta description',
    },
    'idx.description-length': {
        severity: 'warn',
        appliesTo: 'indexable',
        description: 'meta description length is between 70 and 160 characters',
    },
    'idx.canonical-present': {
        severity: 'error',
        appliesTo: 'indexable',
        description: 'indexable page has a canonical link',
    },
    'idx.canonical-self': {
        severity: 'error',
        appliesTo: 'indexable',
        description: 'canonical is absolute, same-origin, and equal to the page URL',
    },
    'idx.hreflang-complete': {
        severity: 'error',
        appliesTo: 'indexable',
        description: 'hreflang lists every indexable locale plus x-default, each absolute and same-origin',
    },
    'idx.hreflang-self': {
        severity: 'error',
        appliesTo: 'indexable',
        description: 'the hreflang entry for this locale equals the canonical',
    },
    'idx.og-required': {
        severity: 'error',
        appliesTo: 'indexable',
        description: 'og:title, og:description, og:url, og:image, og:type, and og:site_name are present',
    },
    'idx.og-url-matches-canonical': {
        severity: 'warn',
        appliesTo: 'indexable',
        description: 'og:url matches the canonical',
    },
    'idx.og-image-absolute': {
        severity: 'error',
        appliesTo: 'indexable',
        description: 'og:image is an absolute https URL',
    },
    'idx.twitter-card': { severity: 'warn', appliesTo: 'indexable', description: 'twitter:card is present' },
    'idx.single-h1': { severity: 'warn', appliesTo: 'indexable', description: 'the page has exactly one h1' },
    'idx.in-sitemap': {
        severity: 'warn',
        appliesTo: 'indexable',
        description: 'with --secret, an indexable page is listed in a sitemap',
    },
    'noidx.not-in-sitemap': {
        severity: 'error',
        appliesTo: 'noindex',
        description: 'a noindex page is not listed in any sitemap',
    },
    'noidx.canonical-elsewhere': {
        severity: 'info',
        appliesTo: 'noindex',
        description: 'the canonical points at a different URL',
    },
    'cross.hreflang-reciprocal': {
        severity: 'error',
        appliesTo: 'cross',
        description: 'each fetched hreflang alternate lists this page back',
    },
    'cross.canonical-target-ok': {
        severity: 'error',
        appliesTo: 'cross',
        description: 'a fetched canonical target returns 200 and is indexable',
    },
    'cross.duplicate-title': {
        severity: 'warn',
        appliesTo: 'cross',
        description: 'indexable pages in the same locale do not share a title',
    },
    'cross.duplicate-description': {
        severity: 'warn',
        appliesTo: 'cross',
        description: 'indexable pages in the same locale do not share a meta description',
    },
    'cross.alternate-status': {
        severity: 'warn',
        appliesTo: 'cross',
        description: 'a fetched hreflang alternate returns HTTP 200',
    },
} as const satisfies Record<
    string,
    { severity: Severity; appliesTo: 'all' | 'indexable' | 'noindex' | 'cross'; description: string }
>;

export type RuleId = keyof typeof RULES;
