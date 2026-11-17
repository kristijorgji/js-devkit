// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { type RouteMatcher } from './classify-route.js';
import { interleaveSeedsByRoute } from './prioritize-seeds.js';

function matcher(routeName: string, pattern: RegExp): RouteMatcher {
    return { routeName, locale: 'en', pattern, staticSegments: 1, segmentCount: 2 };
}

describe('interleaveSeedsByRoute', () => {
    it('round-robins routes so a large agency bucket cannot fill maxUrls alone', () => {
        const agencies = Array.from({ length: 400 }, (_, index) => `https://www.example.com/en/agencies/a-${index}`);
        const homes = Array.from({ length: 4 }, (_, index) => `https://www.example.com/en/home-${index}`);
        const countries = Array.from({ length: 4 }, (_, index) => `https://www.example.com/en/country-${index}`);
        const matchers: RouteMatcher[] = [
            matcher('agencyHome', /^\/en\/agencies\/[^/]+\/?$/),
            matcher('home', /^\/en\/home-\d+\/?$/),
            matcher('countryPillar', /^\/en\/country-\d+\/?$/),
        ];
        const ordered = interleaveSeedsByRoute([...agencies, ...homes, ...countries], matchers, 12, ['en']);
        const routes = ordered.map((url) => {
            if (url.includes('/agencies/')) {
                return 'agencyHome';
            }
            if (url.includes('/home-')) {
                return 'home';
            }
            return 'countryPillar';
        });
        expect(ordered).toHaveLength(12);
        expect(new Set(routes)).toEqual(new Set(['agencyHome', 'home', 'countryPillar']));
        expect(routes.filter((route) => route === 'agencyHome')).not.toHaveLength(12);
    });
});
