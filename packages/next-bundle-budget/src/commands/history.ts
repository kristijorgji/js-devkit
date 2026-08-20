import { exec } from 'node:child_process';
import { existsSync, writeFileSync } from 'node:fs';
import http from 'node:http';
import { resolve } from 'node:path';

import { cliLogger, logFatalAndExit } from '@kristijorgji/cli-kit';

import type { ResolvedBundleBudgetConfig } from '../config/types.js';
import { loadBundleHistory } from '../history/load.js';
import { ensureBundleHistoryDir, resolveBundleHistoryPath, resolveBundleViewerPath } from '../history/paths.js';
import { renderBundleHistoryHtml } from '../viewer/render-viewer-html.js';

export interface HistoryOptions {
    serve?: boolean;
    port?: number;
}

function openBrowser(url: string): void {
    const command = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
    exec(`${command} ${url}`);
}

export function runHistory(config: ResolvedBundleBudgetConfig, options: HistoryOptions = {}): void {
    const historyPath = resolveBundleHistoryPath(config.historyDir);
    if (!existsSync(historyPath)) {
        logFatalAndExit('No bundle history found. Run a successful size-limit check first.');
    }

    const history = loadBundleHistory(historyPath);
    const html = renderBundleHistoryHtml(history, config.viewerTitle);
    const outputPath = resolveBundleViewerPath(config.historyDir);
    ensureBundleHistoryDir(config.historyDir);
    writeFileSync(outputPath, html, 'utf8');
    cliLogger.info(`Wrote ${outputPath}`);

    if (!options.serve) {
        openBrowser(`file://${resolve(outputPath)}`);
        return;
    }

    const port = options.port ?? 4010;
    const server = http.createServer((_request, response) => {
        response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        response.end(html);
    });

    server.listen(port, '127.0.0.1', () => {
        const url = `http://127.0.0.1:${port}`;
        cliLogger.info(`Serving bundle history at ${url}`);
        openBrowser(url);
    });
}
