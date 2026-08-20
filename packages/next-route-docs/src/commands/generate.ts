import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { cliLogger } from '@kristijorgji/cli-kit';

import { buildRouteCatalog } from '../catalog/build-catalog.js';
import { renderRoutesHtml } from '../catalog/render-html.js';
import { serializeRouteCatalog } from '../catalog/render-json.js';
import { renderRoutesMarkdown } from '../catalog/render-markdown.js';
import type { ResolvedRouteDocsConfig } from '../config/types.js';

export function outputPaths(config: ResolvedRouteDocsConfig) {
    return {
        markdown: join(config.outDir, `${config.basename}.md`),
        json: join(config.outDir, `${config.basename}.json`),
        html: join(config.outDir, `${config.basename}.html`),
    };
}

export function generateOutputs(config: ResolvedRouteDocsConfig): { catalog: ReturnType<typeof buildRouteCatalog>; files: Record<string, string> } {
    const catalog = buildRouteCatalog(config);
    const paths = outputPaths(config);
    const files: Record<string, string> = {};
    if (config.outputs.includes('markdown')) {
        files.markdown = renderRoutesMarkdown(catalog, config);
    }
    if (config.outputs.includes('json')) {
        files.json = serializeRouteCatalog(catalog, config);
    }
    if (config.outputs.includes('html')) {
        files.html = renderRoutesHtml(catalog, config);
    }
    return { catalog, files: Object.fromEntries(Object.entries(files).map(([kind, body]) => [paths[kind as keyof typeof paths], body])) };
}

export function runGenerate(config: ResolvedRouteDocsConfig): void {
    mkdirSync(config.outDir, { recursive: true });
    const { files } = generateOutputs(config);
    for (const [path, body] of Object.entries(files)) {
        writeFileSync(path, body);
        cliLogger.info(`Wrote ${path}`);
    }
}
