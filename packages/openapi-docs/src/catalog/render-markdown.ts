import type { ResolvedOpenApiDocsConfig } from '../config/types.js';

import type { RouteCatalogRow } from './build-catalog.js';

function escapeMdCell(value: string): string {
    return value.replace(/\|/g, '\\|');
}

export function renderApiRoutesMarkdown(rows: RouteCatalogRow[], config: ResolvedOpenApiDocsConfig): string {
    const lines: string[] = [
        `# ${config.viewerTitle}`,
        '',
        'Generated from the OpenAPI document. Do not edit by hand — run `kj-openapi docs`.',
        '',
        'For sortable/filterable tables, open the HTML viewer (`kj-openapi open`).',
        '',
        '| Method | Path | Auth Required | Permissions Required | Description |',
        '| ------ | ---- | ------------- | -------------------- | ----------- |',
        ...rows.map((row) => {
            return `| ${escapeMdCell(row.method.padEnd(6))} | \`${escapeMdCell(row.path)}\` | ${escapeMdCell(row.authRequired.padEnd(15))} | ${escapeMdCell(row.permissionsRequired.padEnd(20))} | ${escapeMdCell(row.description)} |`;
        }),
    ];

    if (config.footnotes.length > 0) {
        lines.push('', ...config.footnotes, '');
    } else {
        lines.push('');
    }

    return config.formatMarkdown(`${lines.join('\n')}\n`);
}
