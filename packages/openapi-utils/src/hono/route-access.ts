import { createRoute, type OpenAPIHono, type RouteConfig, type RouteHandler } from '@hono/zod-openapi';
import type { Env, MiddlewareHandler } from 'hono';

export type OpenApiSecurityRequirement = Record<string, string[]>;
export type CreatedRoute = ReturnType<typeof createRoute>;

export interface RouteAccessKitOptions<A extends string> {
    /** OpenAPI `security` per access level. Use `[]` for public. */
    security: Record<A, [] | OpenApiSecurityRequirement[]>;
    /** Middleware enforced for an access level (e.g. `{ bearer: [authMiddleware] }`). */
    accessMiddleware?: Partial<Record<A, MiddlewareHandler[]>>;
    /** Access level applied router-wide by `createAuthenticatedRouter`. */
    authenticatedAccess: A;
    /** App factory (validation hook, onError). */
    createApp: <E extends Env = Env>() => OpenAPIHono<E>;
}

export type RouteAccessKit<A extends string> = ReturnType<typeof createRouteAccessKit<A>>;

export function createRouteAccessKit<A extends string>(options: RouteAccessKitOptions<A>) {
    const routerHasWideAuthKey = Symbol('routerHasWideAuth');
    const routeAccessByRoute = new WeakMap<CreatedRoute, A>();

    function getRouteAccess(route: CreatedRoute): A | undefined {
        return routeAccessByRoute.get(route);
    }

    function accessMw(access: A): MiddlewareHandler[] {
        return options.accessMiddleware?.[access] ?? [];
    }

    function isAuthenticatedRouter<E extends Env>(app: OpenAPIHono<E>): boolean {
        return Boolean((app as OpenAPIHono<E> & { [routerHasWideAuthKey]?: boolean })[routerHasWideAuthKey]);
    }

    function shouldApplyPerRouteMiddleware<E extends Env>(
        app: OpenAPIHono<E>,
        route: CreatedRoute,
        middleware: MiddlewareHandler[] | undefined,
    ): boolean {
        const access = getRouteAccess(route);
        const hasExtras = (middleware?.length ?? 0) > 0;
        const hasAccessMw = access !== undefined && accessMw(access).length > 0;
        if (!hasExtras && (!hasAccessMw || isAuthenticatedRouter(app))) {
            return false;
        }
        return access !== undefined;
    }

    function applyRouteMiddleware<E extends Env>(
        app: OpenAPIHono<E>,
        route: CreatedRoute,
        access: A,
        ...extra: MiddlewareHandler[]
    ): void {
        const handlers = [...accessMw(access), ...extra];
        if (handlers.length > 0) {
            app.use(route.getRoutingPath(), ...handlers);
        }
    }

    function createApiRoute<const T extends Omit<RouteConfig, 'security'>>(access: A, config: T) {
        const route = createRoute({ ...config, security: options.security[access] });
        routeAccessByRoute.set(route, access);
        return route;
    }

    function registerOpenAPIRoute<E extends Env, R extends CreatedRoute>(
        app: OpenAPIHono<E>,
        registration: { route: R; handler: RouteHandler<R, E>; middleware?: MiddlewareHandler[] },
    ): R {
        if (shouldApplyPerRouteMiddleware(app, registration.route, registration.middleware)) {
            const access = getRouteAccess(registration.route);
            if (!access) {
                throw new Error('registerOpenAPIRoute: route must be created with createApiRoute when using middleware');
            }
            applyRouteMiddleware(app, registration.route, access, ...(registration.middleware ?? []));
        }
        app.openapi(registration.route, registration.handler as Parameters<OpenAPIHono<E>['openapi']>[1]);
        return registration.route;
    }

    function createAuthenticatedRouter<E extends Env = Env>(opts?: {
        middleware?: MiddlewareHandler[];
    }): OpenAPIHono<E> {
        const app = options.createApp<E>();
        (app as OpenAPIHono<E> & { [routerHasWideAuthKey]?: boolean })[routerHasWideAuthKey] = true;
        app.use('/*', ...accessMw(options.authenticatedAccess), ...(opts?.middleware ?? []));
        return app;
    }

    return {
        createApiRoute,
        registerOpenAPIRoute,
        createAuthenticatedRouter,
        getRouteAccess,
    };
}
