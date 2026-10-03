import { swaggerUI } from '@hono/swagger-ui';
import type { OpenAPIHono } from '@hono/zod-openapi';
import type { Env } from 'hono';

export interface BaseUrlServerVariableOptions {
    name: string;
    default: string;
    enum: string[];
    description: string;
}

export interface BaseUrlServer {
    url: string;
    description: string;
    variables: Record<string, { default: string; enum: string[]; description: string }>;
    [key: `x-${string}`]: unknown;
}

export function buildBaseUrlServer(input: {
    variable: BaseUrlServerVariableOptions;
    pathSuffix?: string;
    description: string;
}): BaseUrlServer {
    const { name, default: defaultValue, enum: enumValues, description } = input.variable;
    return {
        url: `{${name}}${input.pathSuffix ?? ''}`,
        description: input.description,
        variables: {
            [name]: {
                default: defaultValue,
                enum: enumValues,
                description,
            },
        },
    };
}

export function registerOpenApiDoc<E extends Env>(
    app: OpenAPIHono<E>,
    input: {
        info: { title: string; version: string; description: string };
        servers: BaseUrlServer[];
        openapi?: '3.1.0';
        docPath?: string;
        swaggerUi?: { path: string; specUrl: string };
    },
): void {
    const openapi = input.openapi ?? '3.1.0';
    const docPath = input.docPath ?? '/openapi.json';
    app.doc(docPath, {
        openapi,
        info: {
            title: input.info.title,
            version: input.info.version,
            description: input.info.description,
        },
        servers: input.servers,
    });
    if (input.swaggerUi) {
        app.get(input.swaggerUi.path, swaggerUI({ url: input.swaggerUi.specUrl }));
    }
}
