const XML_ESCAPE_MAP: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&apos;',
};

/** Escape `&`, `<`, `>`, `"`, and `'` for HTML text and attribute values. */
export function escapeHtml(value: string): string {
    return value.replace(/[&<>"']/g, (char) => XML_ESCAPE_MAP[char] ?? char);
}
