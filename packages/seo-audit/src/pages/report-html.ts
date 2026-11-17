import { escapeHtml } from './escape-html.js';

import { REPORT_CSS, REPORT_SCRIPT } from './report-html-script.js';
import type { SeoAuditReport } from './types.js';

function safeJson(report: SeoAuditReport): string {
    return JSON.stringify(report).replace(/</g, '\\u003c');
}

export function renderReportHtml(report: SeoAuditReport): string {
    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>SEO audit ${escapeHtml(report.baseUrl)}</title>
  <style>${REPORT_CSS}</style>
</head>
<body>
  <div class="chrome">
    <header id="header"></header>
    <section id="summary"></section>
    <section id="filters"></section>
  </div>
  <main>
    <section id="coverage"><div id="coverage-panel" hidden></div></section>
    <section id="table"></section>
  </main>
  <script type="application/json" id="seo-audit-data">${safeJson(report)}</script>
  <script>${REPORT_SCRIPT}</script>
</body>
</html>
`;
}
