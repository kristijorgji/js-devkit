import { describe, expect, it } from 'vitest';

import { contentTypeForFileName } from './content-type.js';

describe('contentTypeForFileName', () => {
    it('looks up common web asset MIME types', () => {
        expect(contentTypeForFileName('main.js')).toBe('application/javascript');
        expect(contentTypeForFileName('logo.png')).toBe('image/png');
        expect(contentTypeForFileName('font.woff2')).toBe('font/woff2');
    });

    it('falls back to octet-stream for unknown extensions', () => {
        expect(contentTypeForFileName('data.unknownext')).toBe('application/octet-stream');
    });
});
