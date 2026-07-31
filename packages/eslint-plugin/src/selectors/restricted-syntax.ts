import type { RestrictedSyntaxEntry } from './types.js';

export interface RestrictedSyntaxOptions {
  /** Keys to omit from the provided groups. */
  exclude?: string[];
  /** Additional entries appended after the collected group entries. */
  extra?: RestrictedSyntaxEntry[];
}

/**
 * Collects all entries from the given keyed selector groups (e.g.
 * `objectLiteralTypingSelectors`, `mockBodySatisfiesSelectors`), optionally filtering
 * out keys and appending extra entries. Useful for composing a project's own
 * `no-restricted-syntax` rule configuration.
 */
export function restrictedSyntax(
  groups: Array<Record<string, RestrictedSyntaxEntry>>,
  options?: RestrictedSyntaxOptions,
): RestrictedSyntaxEntry[] {
  const exclude = new Set(options?.exclude ?? []);
  const extra = options?.extra ?? [];

  const entries: RestrictedSyntaxEntry[] = [];
  for (const group of groups) {
    for (const [key, entry] of Object.entries(group)) {
      if (exclude.has(key)) {
        continue;
      }
      entries.push(entry);
    }
  }

  return [...entries, ...extra];
}

/**
 * Convenience wrapper that produces a ready-to-spread `no-restricted-syntax` rule
 * entry: `['error', ...entries]`.
 */
export function restrictedSyntaxRuleEntry(
  groups: Array<Record<string, RestrictedSyntaxEntry>>,
  options?: RestrictedSyntaxOptions,
  severity: 'error' | 'warn' = 'error',
): ['error' | 'warn', ...RestrictedSyntaxEntry[]] {
  return [severity, ...restrictedSyntax(groups, options)];
}
