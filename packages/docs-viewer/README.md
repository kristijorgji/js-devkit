# @kristijorgji/docs-viewer

Shared HTML table-viewer shell for generated documentation. Consumers ship their own template and columns; this package injects the title, base styles, and JSON payload.

## Install

```bash
pnpm add -D @kristijorgji/docs-viewer
```

## Usage

```ts
import { renderDocsViewerHtml } from '@kristijorgji/docs-viewer';

const html = renderDocsViewerHtml({
    template, // contains __VIEWER_TITLE__, <!-- VIEWER_STYLES -->, <!-- VIEWER_DATA -->
    data: { rows },
    title: 'Routes',
    extraStyles: 'h2 { margin-top: 2rem; }',
});
```

Placeholders:

| Token | Purpose |
| --- | --- |
| `__VIEWER_TITLE__` | Escaped title (use in `<title>` and `<h1>`) |
| `<!-- VIEWER_STYLES -->` | Base table CSS plus optional `extraStyles` |
| `<!-- VIEWER_DATA -->` | `JSON.stringify(data)` |

## License

MIT
