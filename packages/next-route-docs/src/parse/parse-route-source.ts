/**
 * Best-effort regex scan of a Next.js route / layout source file.
 *
 * `hasSearchParams` is `/\\bsearchParams\\b/` and `hasDynamicApis` matches any
 * `cookies(` / `headers(` call after comment stripping. Treat rendering labels
 * as a heuristic; `auditCatalog` cross-checks them against real build output.
 */
export interface ParsedRouteExports {
    revalidateSeconds?: number;
    revalidateDisabled?: boolean;
    hasGenerateStaticParams: boolean;
    hasSearchParams: boolean;
    hasDynamicApis: boolean;
    hasUseCache: boolean;
    dynamic?: string;
    runtime?: string;
    hasNoIndexRobots: boolean;
}

export const emptyParsedRouteExports: ParsedRouteExports = {
    hasGenerateStaticParams: false,
    hasSearchParams: false,
    hasDynamicApis: false,
    hasUseCache: false,
    hasNoIndexRobots: false,
};

function stripSourceComments(source: string): string {
    return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
}

export function parseRouteSource(source: string): ParsedRouteExports {
    const code = stripSourceComments(source);
    const revalidateFalse = /export\s+const\s+revalidate\s*=\s*false\b/.test(code);
    const revalidateMatch = code.match(/export\s+const\s+revalidate\s*=\s*(\d+)/);
    const dynamicMatch = code.match(/export\s+const\s+dynamic\s*=\s*['"]([^'"]+)['"]/);
    const runtimeMatch = code.match(/export\s+const\s+runtime\s*=\s*['"]([^'"]+)['"]/);

    return {
        ...(revalidateMatch ? { revalidateSeconds: Number(revalidateMatch[1]) } : {}),
        ...(revalidateFalse || revalidateMatch?.[1] === '0' ? { revalidateDisabled: true } : {}),
        hasGenerateStaticParams: /export\s+(?:async\s+)?function\s+generateStaticParams/.test(code),
        hasSearchParams: /\bsearchParams\b/.test(code),
        hasDynamicApis: /\b(?:cookies|headers|draftMode|connection)\s*\(/.test(code),
        hasUseCache: /['"]use cache['"]/.test(code),
        ...(dynamicMatch ? { dynamic: dynamicMatch[1] } : {}),
        ...(runtimeMatch ? { runtime: runtimeMatch[1] } : {}),
        hasNoIndexRobots: /robots:\s*\{[^}]*index:\s*false/.test(source),
    };
}

export function mergeParsedRouteExports(page: ParsedRouteExports, layouts: ParsedRouteExports[]): ParsedRouteExports {
    return {
        ...page,
        hasDynamicApis: page.hasDynamicApis || layouts.some((layout) => layout.hasDynamicApis),
        hasUseCache: page.hasUseCache || layouts.some((layout) => layout.hasUseCache),
        dynamic: page.dynamic ?? layouts.find((layout) => layout.dynamic)?.dynamic,
        runtime: page.runtime ?? layouts.find((layout) => layout.runtime)?.runtime,
    };
}

export function formatPageRendering(parsed: ParsedRouteExports): string {
    if (parsed.dynamic === 'force-dynamic' || parsed.revalidateDisabled) {
        return 'Dynamic';
    }
    if (parsed.hasDynamicApis) {
        return 'Dynamic (cookies/headers)';
    }
    if (parsed.hasSearchParams) {
        return 'Dynamic (searchParams)';
    }
    if (parsed.hasGenerateStaticParams) {
        return parsed.revalidateSeconds !== undefined
            ? `Build-time SSG + ISR (${parsed.revalidateSeconds}s)`
            : 'Build-time SSG';
    }
    if (parsed.revalidateSeconds !== undefined) {
        return `On-demand ISR (${parsed.revalidateSeconds}s)`;
    }
    return 'Dynamic';
}

export function isDeclaredCacheableRendering(label: string): boolean {
    return label.startsWith('Build-time SSG') || label.startsWith('On-demand ISR');
}

export function formatInfraRendering(parsed: ParsedRouteExports): string {
    if (parsed.dynamic === 'force-dynamic') {
        return 'Dynamic handler';
    }
    if (parsed.revalidateSeconds !== undefined) {
        return `ISR (${parsed.revalidateSeconds}s)`;
    }
    if (parsed.runtime === 'edge') {
        return 'Edge';
    }
    if (
        !parsed.dynamic &&
        parsed.revalidateSeconds === undefined &&
        !parsed.runtime &&
        !parsed.hasGenerateStaticParams &&
        !parsed.hasSearchParams &&
        !parsed.hasNoIndexRobots
    ) {
        return 'Static';
    }
    return 'Dynamic';
}

export function detectRouteHandlerMethods(source: string): string[] {
    const methods: string[] = [];
    for (const method of ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'] as const) {
        if (new RegExp(`export\\s+async\\s+function\\s+${method}\\b`).test(source)) {
            methods.push(method);
        }
    }
    return methods;
}
