import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { cliLogger } from '@kristijorgji/cli-kit';

import { buildRouteCatalog } from '../catalog/build-catalog.js';
import { renderApiRoutesHtml } from '../catalog/render-html.js';
import { serializeRouteCatalog } from '../catalog/render-json.js';
import { renderApiRoutesMarkdown } from '../catalog/render-markdown.js';
import type { ResolvedOpenApiDocsConfig } from '../config/types.js';

export function outputPaths(config: ResolvedOpenApiDocsConfig) {
    return {
        markdown: join(config.outDir, `${config.basename}.md`),
        json: join(config.outDir, `${config.basename}.json`),
        html: join(config.outDir, `${config.basename}.html`),
    };
}

export function generateOutputs(config: ResolvedOpenApiDocsConfig): { files: Record<string, string> } {
    const rows = buildRouteCatalog(config);
    const paths = outputPaths(config);
    const files: Record<string, string> = {};
    if (config.outputs.includes('markdown')) {
        files[paths.markdown] = renderApiRoutesMarkdown(rows, config);
    }
    if (config.outputs.includes('json')) {
        files[paths.json] = serializeRouteCatalog(rows);
    }
    if (config.outputs.includes('html')) {
        files[paths.html] = renderApiRoutesHtml(rows, config);
    }
    return { files };
}

export function runDocs(config: ResolvedOpenApiDocsConfig): void {
    mkdirSync(config.outDir, { recursive: true });
    const { files } = generateOutputs(config);
    for (const [path, body] of Object.entries(files)) {
        writeFileSync(path, body);
        cliLogger.info(`Wrote ${path}`);
    }
}
