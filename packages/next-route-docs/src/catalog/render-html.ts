import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { renderDocsViewerHtml } from '@kristijorgji/docs-viewer';

import type { ResolvedRouteDocsConfig } from '../config/types.js';

import type { RouteCatalog } from './build-catalog.js';

const TEMPLATE_PATH = join(dirname(fileURLToPath(import.meta.url)), '../viewer/routes.template.html');

export function renderRoutesHtml(catalog: RouteCatalog, config: ResolvedRouteDocsConfig): string {
    const template = readFileSync(TEMPLATE_PATH, 'utf8');
    return renderDocsViewerHtml({
        template,
        title: config.viewerTitle,
        data: {
            locales: config.locales,
            appPages: catalog.appPages,
            infraRoutes: catalog.infraRoutes,
        },
    });
}
