import { z } from '@hono/zod-openapi';
import { type ZodObject, type ZodType, type ZodUnion } from 'zod';

function isZodObject(schema: ZodType): schema is ZodObject {
    return schema.def.type === 'object';
}

function isZodUnion(schema: ZodType): schema is ZodUnion {
    return schema.def.type === 'union';
}

function cloneUnionForOpenApi(schema: ZodUnion): ZodType {
    const cloned = schema.options.map((option) => {
        const typed = option as ZodType;
        if (!isZodObject(typed)) {
            throw new Error(`withOpenApi union options must be ZodObject, got ${typed.def.type}`);
        }
        return z.object({}).extend(typed.shape);
    });
    const [first, second, ...rest] = cloned;
    if (!first || !second) {
        throw new Error('withOpenApi union requires at least two options');
    }
    return z.union([first, second, ...rest]);
}

/**
 * Bridges a shared Zod schema into Hono's OpenAPI system.
 * Keeps original types while adding the .openapi() metadata.
 */
export function withOpenApi<T extends ZodType>(schema: T, name: string): T {
    if (isZodObject(schema)) {
        return z.object({}).extend(schema.shape).openapi(name) as unknown as T;
    }
    if (isZodUnion(schema)) {
        return cloneUnionForOpenApi(schema).openapi(name) as unknown as T;
    }
    throw new Error(`withOpenApi only supports ZodObject and ZodUnion, got ${schema.def.type}`);
}
