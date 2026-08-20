import { describe, expect, it } from 'vitest';

import { matchesAnyGlob, matchesGlob } from './glob-match.js';

describe('glob matching', () => {
    it('matches single-segment wildcards', () => {
        expect(matchesGlob('favicon-16x16.png', 'favicon-*.png')).toBe(true);
        expect(matchesGlob('favicon.ico', 'favicon-*.png')).toBe(false);
    });

    it('matches recursive wildcards', () => {
        expect(matchesGlob('storybook/crop-sample.jpg', 'storybook/**')).toBe(true);
        expect(matchesGlob('images/logo.png', 'storybook/**')).toBe(false);
    });

    it('matches any pattern in a list', () => {
        expect(matchesAnyGlob('sw.js', ['sw.js', 'mockServiceWorker.js'])).toBe(true);
        expect(matchesAnyGlob('images/logo.png', ['images/**', 'fonts/**'])).toBe(true);
    });
});
