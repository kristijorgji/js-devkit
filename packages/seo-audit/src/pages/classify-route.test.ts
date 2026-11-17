// @vitest-environment node
import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { SUPPORTED } from './__fixtures__/pages.js';
import { type ClassifiedRoute, classifyUrl, loadRouteMatchers, parseRoutesDocument } from './classify-route.js';

const routes = parseRoutesDocument(readFileSync(new URL('./__fixtures__/routes.json', import.meta.url), 'utf8'));
const matchers = loadRouteMatchers(routes);

describe('classifyUrl', () => {
    it.each([
        ['https://www.example.com/en', 'home', 'en'],
        ['https://www.example.com/en/properties/for-sale-x-hOJMwg91', 'detail', 'en'],
        ['https://www.example.com/sq/anetaret/some-agency', 'memberHome', 'sq'],
        ['https://www.example.com/en/country/city', 'cityPillar', 'en'],
        ['https://www.example.com/en/country', 'countryPillar', 'en'],
        ['https://www.example.com/en/nope/a/b/c/d', 'unknown', 'en'],
    ] as const)('%s is %s', (url, routeName, locale) => {
        expect(classifyUrl(url, matchers, SUPPORTED)).toEqual({
            routeName,
            locale,
        } satisfies ClassifiedRoute);
    });
});
