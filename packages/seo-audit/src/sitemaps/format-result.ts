import { maskSecret } from '../pages/sources.js';

import type { SeoCheckResult } from './types.js';

export function formatCheckLine(result: SeoCheckResult, secret?: string): string {
    const name = maskSecret(result.name, secret);
    if (result.ok) {
        return `PASS ${name}`;
    }
    return `FAIL ${name}: ${maskSecret(result.messages.join('; '), secret)}`;
}
