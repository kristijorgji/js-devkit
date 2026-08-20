import { exec } from 'node:child_process';
import { existsSync } from 'node:fs';
import http from 'node:http';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { cliLogger, logFatalAndExit } from '@kristijorgji/cli-kit';

import type { ResolvedRouteDocsConfig } from '../config/types.js';

import { outputPaths, runGenerate } from './generate.js';

export interface OpenOptions {
    serve?: boolean;
    port?: number;
}

function openBrowser(url: string): void {
    const command = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
    exec(`${command} ${url}`);
}

export function runOpen(config: ResolvedRouteDocsConfig, options: OpenOptions = {}): void {
    const htmlPath = outputPaths(config).html;
    if (!existsSync(htmlPath)) {
        runGenerate(config);
    }
    if (!existsSync(htmlPath)) {
        logFatalAndExit(`HTML viewer not found at ${htmlPath}. Enable the html output and run kj-next-routes generate.`);
    }

    const html = readFileSync(htmlPath, 'utf8');

    if (!options.serve) {
        openBrowser(`file://${resolve(htmlPath)}`);
        return;
    }

    const port = options.port ?? 4011;
    const server = http.createServer((_request, response) => {
        response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        response.end(html);
    });

    server.listen(port, '127.0.0.1', () => {
        const url = `http://127.0.0.1:${port}`;
        cliLogger.info(`Serving route docs at ${url}`);
        openBrowser(url);
    });
}
