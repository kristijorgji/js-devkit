import { z } from '@hono/zod-openapi';
import { describe, expect, it } from 'vitest';

import { withOpenApi } from './with-openapi.js';

describe('withOpenApi', () => {
    it('clones objects so required fields still fail closed', () => {
        const schema = withOpenApi(z.object({ slug: z.string().min(1) }), 'TestSlug');
        expect(schema.safeParse({ slug: 'acme-brokerage' }).success).toBe(true);
        expect(schema.safeParse({}).success).toBe(false);
    });

    it('clones a union rather than optional fields', () => {
        const schema = withOpenApi(
            z.union([z.object({ token: z.string() }), z.object({ id: z.string(), code: z.string() })]),
            'ClaimVerifyRequest',
        );
        expect(schema.safeParse({ token: 'claim-token' }).success).toBe(true);
        expect(schema.safeParse({ id: 'claim-1', code: '123456' }).success).toBe(true);
        expect(schema.safeParse({}).success).toBe(false);

        const jsonSchema = schema.toJSONSchema() as { anyOf?: unknown; oneOf?: unknown; properties?: unknown };
        expect(jsonSchema.anyOf ?? jsonSchema.oneOf).toBeDefined();
        expect(jsonSchema.properties).toBeUndefined();
    });

    it('throws for schema kinds other than object and union', () => {
        expect(() => withOpenApi(z.string().min(1), 'NotSupported')).toThrow(
            'withOpenApi only supports ZodObject and ZodUnion, got string',
        );
    });
});
