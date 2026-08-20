import type { ResolvedRouteDocsConfig } from '../config/types.js';

import type { AppPageCatalogRow, InfraCatalogRow, RouteCatalog } from './build-catalog.js';

function escapeMdCell(value: string): string {
    return value.replace(/\|/g, '\\|');
}

function renderLocalePathColumns(pathsByLocale: Record<string, string | '-'>, locales: string[]): string[] {
    return locales.map((locale) => {
        const path = pathsByLocale[locale];
        return path && path !== '-' ? `\`${path}\`` : '-';
    });
}

function renderMarkdownTable(header: string[], rows: string[][]): string[] {
    const sep = header.map(() => '---');
    return [`| ${header.join(' | ')} |`, `| ${sep.join(' | ')} |`, ...rows.map((cells) => `| ${cells.join(' | ')} |`)];
}

function appPageHasLocalizedPaths(row: AppPageCatalogRow, locales: string[]): boolean {
    return locales.some((locale) => {
        const path = row.pathsByLocale[locale];
        return Boolean(path && path !== '-');
    });
}

function infraHasLocalePaths(row: InfraCatalogRow): boolean {
    return Object.values(row.pathsByLocale).some((path) => path !== '-');
}

export function renderRoutesMarkdown(catalog: RouteCatalog, config: ResolvedRouteDocsConfig): string {
    const localeHeaders = config.locales.map((locale) => `Path (${locale})`);

    const appMainRows = catalog.appPages.map((row) =>
        [row.routeName, row.auth, row.declared, row.rendering, row.indexable, row.description].map(escapeMdCell),
    );

    const appLocalizedRows = catalog.appPages
        .filter((row) => appPageHasLocalizedPaths(row, config.locales))
        .map((row) => [row.routeName, ...renderLocalePathColumns(row.pathsByLocale, config.locales)].map(escapeMdCell));

    const infraMainRows = catalog.infraRoutes.map((row) => [
        escapeMdCell(row.methods),
        `\`${row.urlPattern}\``,
        escapeMdCell(row.kind),
        escapeMdCell(row.auth),
        escapeMdCell(row.rendering),
        escapeMdCell(row.description),
    ]);

    const infraLocalizedRows = catalog.infraRoutes
        .filter(infraHasLocalePaths)
        .map((row) =>
            [row.urlPattern, ...renderLocalePathColumns(row.pathsByLocale, config.locales)].map((cell) =>
                cell.startsWith('`') ? cell : escapeMdCell(cell),
            ),
        );

    const sections: string[] = [
        `# ${config.viewerTitle}`,
        '',
        'Generated from the App Router filesystem. Do not edit by hand — run `kj-next-routes generate`.',
        '',
        'For sortable/filterable tables, open the HTML viewer (`kj-next-routes open`).',
        '',
        '**Declared** is the page `page.tsx` segment config. **Actual** walks parent `layout.tsx` files for',
        '`cookies()` / `headers()` / `searchParams`. After `next build`, `kj-next-routes audit` compares this to',
        '`.next/prerender-manifest.json`.',
        '',
        '## App pages',
        '',
        ...renderMarkdownTable(
            ['Logical route', 'Auth', 'Declared', 'Actual', 'Indexable', 'Description'],
            appMainRows,
        ),
    ];

    if (config.locales.length > 0 && appLocalizedRows.length > 0) {
        sections.push(
            '',
            '### Localized paths (app pages)',
            '',
            ...renderMarkdownTable(['Logical route', ...localeHeaders], appLocalizedRows),
        );
    }

    sections.push(
        '',
        '## Metadata and infrastructure routes',
        '',
        'URLs served outside user-facing `page.tsx` routes: metadata files, OG images, route handlers, and `public/`',
        'assets.',
        '',
        ...renderMarkdownTable(['Method', 'URL pattern', 'Kind', 'Auth', 'Rendering', 'Description'], infraMainRows),
    );

    if (config.locales.length > 0 && infraLocalizedRows.length > 0) {
        sections.push(
            '',
            '### Localized paths (infrastructure)',
            '',
            ...renderMarkdownTable(['URL pattern', ...localeHeaders], infraLocalizedRows),
        );
    }

    sections.push('');
    return config.formatMarkdown(sections.join('\n'));
}
