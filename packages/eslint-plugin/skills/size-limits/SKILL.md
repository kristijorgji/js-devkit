---
name: size-limits
description: >
  Split oversized TypeScript modules flagged by max-lines, max-lines-per-function,
  or sonarjs/cognitive-complexity. Use when sizeLimits() reports errors, when a
  .ts file grows past the file or function cap, or when extracting helpers from
  a public entry module.
paths:
  - '**/*.ts'
---

# Size limits

Workflow for acting on ESLint size-limit errors from
`@kristijorgji/eslint-plugin`'s `sizeLimits()` config.

## Detection thresholds

| Target | Rules | Defaults |
| --- | --- | --- |
| `**/*.ts`, `**/*.mts`, `**/*.cts` | `max-lines`, `max-lines-per-function`, `sonarjs/cognitive-complexity` | 300 lines/file, 80 lines/fn, complexity 20 |

Default ignores: `**/*.test.*`, `**/*.spec.*`, `**/*.stories.*`, `**/*.d.ts`,
`**/test/**`, `**/tests/**`, `**/__tests__/**`, `**/__fixtures__/**`, `**/__mocks__/**`.

Hook files (`**/use*.ts`, `**/hooks/**/*.ts`) are often excluded from
`max-lines-per-function` because `componentExtraction()` already caps them at 120.

All rules are **error** by default. A frozen per-file exemption list may raise
the cap for existing files; values may only shrink.

## Workflow

### 1. Keep the public entry

Keep the original file as the public entry. Do not rename exported functions or
change their signatures. Callers and existing tests keep importing the same
module.

### 2. Move into sibling modules

Copy function bodies character for character into sibling files next to the
entry (or a feature folder when the split has several related files). Allowed
edits:

- adding `export`
- adding or adjusting `import` lines
- replacing one contiguous block of statements with a call to a new function
  whose body is exactly that block (variables the block reads become
  parameters; variables it assigns that are used afterwards become return
  values)

Do not change log messages, conditions, operator choice (`??` vs `||`),
default values, `await` order, or the order of side effects.

### 3. Move module state with its functions

A module-level `let` or constant moves with the functions that read or write
it. Do not wrap or re-export a module that existing tests mock.

### 4. No barrels

Do not add `index.ts` re-export files. Callers import the entry file by its
full path.

### 5. Leave existing tests unchanged

Existing tests are the behavior oracle. Do not edit them except to update an
import path when a symbol actually moved (and the plan or lint error names
that path). Add colocated unit tests only for newly extracted pure helpers.

### 6. Fallback when a new file still exceeds a limit

Extract its largest contiguous block into a named function in the same file.
Repeat until the file passes. Do not raise thresholds and do not add the new
file to the exemption list.

## Anti-patterns

- Rewriting control flow while splitting (shared loop helpers, lookup tables
  for status codes) unless the consuming project explicitly asked for that.
- Fixing odd-looking but working code (`a.trim() ?? fallback`) as part of the
  split.
- Adding a file to the exemption list instead of extracting.
- Creating `index.ts` barrels to hide the new files.
