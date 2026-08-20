import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { renderDocsViewerHtml } from '@kristijorgji/docs-viewer';

import type { ResolvedOpenApiDocsConfig } from '../config/types.js';

import type { RouteCatalogRow } from './build-catalog.js';

const TEMPLATE_PATH = join(dirname(fileURLToPath(import.meta.url)), '../viewer/api-routes.template.html');

function footnoteForHtml(footnotes: string[]): string {
    return footnotes
        .map((footnote) => footnote.replace(/^\[\^[^\]]+\]:\s*/, '').replace(/\*\*([^*]+)\*\*/g, '$1'))
        .join('\n\n');
}

export function renderApiRoutesHtml(rows: RouteCatalogRow[], config: ResolvedOpenApiDocsConfig): string {
    const template = readFileSync(TEMPLATE_PATH, 'utf8');
    return renderDocsViewerHtml({
        template,
        title: config.viewerTitle,
        data: {
            routes: rows,
            footnote: footnoteForHtml(config.footnotes),
        },
    });
}
