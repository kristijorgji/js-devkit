import { z } from '@hono/zod-openapi';
import { describe, expect, it } from 'vitest';

import { jsonContent, multipartFormContent } from './content.js';

describe('jsonContent', () => {
    it('returns application/json content then description', () => {
        const schema = z.object({ id: z.string() });
        expect(jsonContent(schema, 'Pet')).toEqual({
            content: { 'application/json': { schema } },
            description: 'Pet',
        });
    });
});

describe('multipartFormContent', () => {
    it('returns multipart/form-data content then description', () => {
        const schema = z.object({ file: z.string() });
        expect(multipartFormContent(schema, 'Upload')).toEqual({
            content: { 'multipart/form-data': { schema } },
            description: 'Upload',
        });
    });
});
