# @kristijorgji/eslint-plugin

Custom ESLint rules for TypeScript and React projects, namespaced under `kj`.

Ships flat-config ready rule implementations, ready-made config factories, and a
small "selector" toolkit for composing your own `no-restricted-syntax` rules.

## Install

```bash
npm install --save-dev @kristijorgji/eslint-plugin
# or
pnpm add -D @kristijorgji/eslint-plugin
```

Peer dependencies: `eslint@^9 || ^10` and `typescript@^5 || ^6`.

## Usage

### Recommended rules

```js
// eslint.config.js
import { recommended } from '@kristijorgji/eslint-plugin';

export default [
  ...recommended(),
  // ...your other config blocks
];
```

`recommended()` registers the `kj` plugin on `**/*.{ts,tsx}` and enables:

- `kj/no-pure-type-alias`
- `kj/no-single-export-barrel`
- `kj/jsx-leading-prop-order`

Pass `{ severity: 'warn' }` to downgrade all of them to warnings.

`kj/no-weak-typeof-satisfies` is **not** in `recommended()` — it needs type information. Use `typed()` for that.

### Type-aware rules

`kj/no-weak-typeof-satisfies` benefits from full type information. Enable it with
`typed()`, pointing `tsconfigRootDir` at the directory containing your `tsconfig.json`:

```js
import { typed } from '@kristijorgji/eslint-plugin';

export default [
  ...typed({ tsconfigRootDir: import.meta.dirname }),
];
```

### Component extraction

Encourage splitting large components and hooks into smaller modules:

```js
import { componentExtraction } from '@kristijorgji/eslint-plugin';

export default [
  ...componentExtraction({
    severity: 'warn',
    componentMaxLines: 70,
    fileMaxLines: 300,
    hookMaxLines: 120,
  }),
];
```

This enables `kj/no-multi-comp` for `**/*.tsx` files, plus `max-lines-per-function`
and `max-lines` for components, and `max-lines-per-function` for hook files
(`**/use*.ts`, `**/hooks/**/*.ts`).

### `no-barrel`

`kj/no-barrel` is opt-in and requires two options, since it targets a specific
workspace package:

```js
import { plugin } from '@kristijorgji/eslint-plugin';

export default [
  {
    files: ['**/*.{ts,tsx}'],
    ignores: ['**/packages/utils/**'],
    plugins: { kj: plugin },
    rules: {
      'kj/no-barrel': ['error', { packageName: '@repo/utils', exampleSubpath: '@repo/utils/media' }],
    },
  },
];
```

### Restricted syntax selectors

`objectLiteralTypingSelectors` and `mockBodySatisfiesSelectors` are keyed records of
`no-restricted-syntax` entries (`{ selector, message }`). Compose them with
`restrictedSyntax()` / `restrictedSyntaxRuleEntry()`:

```js
import {
  mockBodySatisfiesSelectors,
  objectLiteralTypingSelectors,
  restrictedSyntaxRuleEntry,
} from '@kristijorgji/eslint-plugin';

export default [
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': restrictedSyntaxRuleEntry(
        [objectLiteralTypingSelectors, mockBodySatisfiesSelectors],
        {
          exclude: ['jsxBinding'],
          extra: [{ selector: 'DebuggerStatement', message: 'No debugger statements.' }],
        },
      ),
    },
  },
];
```

`restrictedSyntaxRuleEntry` returns a ready `['error' | 'warn', ...entries]` tuple;
use `restrictedSyntax()` directly if you want just the entry array.

## Rules

| Rule | Description | Fixable |
| --- | --- | --- |
| `kj/no-multi-comp` | Disallow multiple React components in a single file. | No |
| `kj/no-pure-type-alias` | Discourage pure re-alias type declarations (`type A = B;`). | No |
| `kj/no-single-export-barrel` | Disallow `index.ts` barrels that only re-export a single symbol. | No |
| `kj/no-weak-typeof-satisfies` | Disallow `typeof expr` in `satisfies` when `expr` is `any`/`unknown`. | No |
| `kj/jsx-leading-prop-order` | Require configured leading JSX attributes to appear in order. | Yes |
| `kj/no-barrel` | Disallow importing/exporting a configured package's barrel entry point. | No |

### Options

- **`kj/no-multi-comp`**: `{ max?: number (default 1), ignoreStateless?: boolean (default false) }`.
  When `ignoreStateless` is `true`, only `class` components count towards the limit.
- **`kj/no-pure-type-alias`**: `{ allowPatterns?: string[] }`. Regex pattern strings;
  alias names matching any of them are allowed.
- **`kj/no-single-export-barrel`**: `{ exportNamePattern?: string (default '^[A-Z]') }`.
  Only applies to files matching `index.ts`/`index.tsx`.
- **`kj/no-weak-typeof-satisfies`**: `{ allowUnknown?: boolean (default false) }`.
  When `true`, only `any` is flagged (not `unknown`). Requires type information —
  use with `typed()` or a type-aware parser configuration.
- **`kj/jsx-leading-prop-order`**: `{ order?: string[] }`, defaults to
  `['data-testid', 'testID', 'key', 'ref', 'id', 'name']`. Never reorders attributes
  across a `{...spread}`.
- **`kj/no-barrel`**: `{ packageName: string, exampleSubpath: string }` (both
  **required**).

## Migrating from ad-hoc project-local rules

If you previously vendored these rules locally, update rule IDs as follows:

| Old rule ID | New rule ID |
| --- | --- |
| `no-multi-comp/no-multi-comp` | `kj/no-multi-comp` |
| `type-alias/no-pure-alias` | `kj/no-pure-type-alias` |
| `no-single-export-barrel/no-single-export-barrel` | `kj/no-single-export-barrel` |
| `repo-typing/no-weak-typeof-satisfies` | `kj/no-weak-typeof-satisfies` |
| `jsx-leading-prop-order/jsx-leading-prop-order` | `kj/jsx-leading-prop-order` |
| `<pkg>/no-barrel` (e.g. `utils/no-barrel`) | `kj/no-barrel` (pass `packageName`/`exampleSubpath` in options) |

## Overriding caveat

ESLint flat config merges array entries in order, and **later blocks win** when they
target overlapping files and rules. If you spread `recommended()` (or any other
config factory from this package) before your own overrides, put your overrides
*after* it in the exported array:

```js
export default [
  ...recommended(),
  {
    files: ['**/*.tsx'],
    rules: {
      // This wins over recommended()'s severity for the same rule/files.
      'kj/jsx-leading-prop-order': 'off',
    },
  },
];
```

Each config factory (`recommended`, `typed`, `componentExtraction`) returns a fresh
array on every call, so it's safe to call them multiple times with different options
in the same config file.

## License

MIT
