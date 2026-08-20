import { escapeHtml } from './escape-html.js';
import { readBaseViewerStyles } from './styles.js';

export const PLACEHOLDERS = {
    title: '__VIEWER_TITLE__',
    styles: '<!-- VIEWER_STYLES -->',
    data: '<!-- VIEWER_DATA -->',
} as const;

export const DEFAULT_VIEWER_TITLE = 'Docs';

export interface RenderDocsViewerHtmlOptions {
    template: string;
    data: unknown;
    title?: string;
    extraStyles?: string;
}

export function renderDocsViewerHtml(options: RenderDocsViewerHtmlOptions): string {
    const title = escapeHtml(options.title?.trim() || DEFAULT_VIEWER_TITLE);
    const styles = [readBaseViewerStyles(), options.extraStyles ?? ''].filter(Boolean).join('\n');
    return options.template
        .replaceAll(PLACEHOLDERS.title, title)
        .replace(PLACEHOLDERS.styles, styles)
        .replace(PLACEHOLDERS.data, JSON.stringify(options.data));
}
