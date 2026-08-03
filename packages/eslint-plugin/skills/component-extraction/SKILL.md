---
name: component-extraction
description: >
    Split oversized React components and hooks flagged by the kj extraction rules.
    Use when kj/no-multi-comp, max-lines-per-function, or max-lines warnings appear,
    when splitting a screen, or when extracting logic into a hook.
paths:
    - '**/*.tsx'
    - '**/*.ts'
---

# Component Extraction

Workflow for acting on ESLint extraction warnings from
`@kristijorgji/eslint-plugin`'s `componentExtraction()` config.

## Detection thresholds

| Target | Rules | Defaults |
| --- | --- | --- |
| `**/*.tsx` | `kj/no-multi-comp`, `max-lines-per-function`, `max-lines` | 70 lines/fn, 300 lines/file |
| `**/use*.ts`, `**/hooks/**/*.ts` | `max-lines-per-function` | 120 lines/fn |

Default ignores: `**/*.test.tsx`, `**/*.stories.tsx`, `**/*.test.ts`, `**/*.stories.ts`.

All rules are **warn-only** by default — they signal extraction candidates, not blockers.

## Override the defaults

```js
import { componentExtraction } from '@kristijorgji/eslint-plugin';

export default [
  ...componentExtraction({
    severity: 'warn',
    componentMaxLines: 70,
    fileMaxLines: 300,
    hookMaxLines: 120,
    componentFiles: ['**/*.tsx'],
    hookFiles: ['**/use*.ts', '**/hooks/**/*.ts'],
    ignores: ['**/*.test.tsx', '**/*.stories.tsx'],
  }),
];
```

## Workflow

### 1. Confirm the signal

Run the consuming project's lint script. Map warnings to the thresholds above.
If only one rule fires, address that rule's intent:

- `kj/no-multi-comp` → move each component into its own file
- `max-lines` / `max-lines-per-function` → extract subcomponents or a `use*` hook

### 2. Decide extraction boundaries

- **Presentational vs logic** — move state/effects into a `use*.ts` hook; keep JSX thin.
- **Reuse** — search the project's shared components and hooks before creating anything new.
- Do **not** extract one-off wrappers with no clarity gain.

### 3. Apply the consuming project's conventions

File layout, Storybook/test coverage policy, and verification commands come from
the consuming project's own component-guidelines, testing, and verification skills.
Do not invent a new folder structure when the project already has one.

## Anti-patterns

- Extracting without searching existing shared components/hooks first.
- Extracting a hook with logic without a matching unit test.
- Splitting purely to silence ESLint when the result is harder to follow.
- Raising thresholds instead of extracting when the code is genuinely oversized.
