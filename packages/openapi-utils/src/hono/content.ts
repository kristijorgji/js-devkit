import type { ZodType } from 'zod';

export function jsonContent<T extends ZodType>(
    schema: T,
    description: string,
): { content: { 'application/json': { schema: T } }; description: string } {
    return {
        content: { 'application/json': { schema } },
        description,
    };
}

export function multipartFormContent<T extends ZodType>(
    schema: T,
    description: string,
): { content: { 'multipart/form-data': { schema: T } }; description: string } {
    return {
        content: { 'multipart/form-data': { schema } },
        description,
    };
}
