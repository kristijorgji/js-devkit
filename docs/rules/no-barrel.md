# `kj/no-barrel`

Disallow importing (or re-exporting) a package barrel; require a subpath instead.

## Rationale

Barrel entrypoints pull large dependency graphs and hide domain boundaries. Force imports like `@repo/utils/media` instead of `@repo/utils`.

Both `packageName` and `exampleSubpath` are **required** options — the same rule instance is reused for every package.

## Incorrect

```ts
// options: { packageName: '@repo/utils', exampleSubpath: '@repo/utils/media' }
import { something } from '@repo/utils';
```

## Correct

```ts
import { something } from '@repo/utils/media';
```

## Options

| Option | Type | Required | Description |
| ------ | ---- | -------- | ----------- |
| `packageName` | `string` | yes | Exact module specifier to ban |
| `exampleSubpath` | `string` | yes | Shown in the error message as the preferred import |

Example flat-config usage:

```js
{
  plugins: { kj: kjPlugin },
  rules: {
    'kj/no-barrel': ['error', { packageName: '@repo/utils', exampleSubpath: '@repo/utils/media' }],
  },
}
```

To ignore the package's own source tree, wrap with `ignores` in the config block (the rule itself does not take an ignore path).

## When to disable

Almost never inside the consuming apps. Package-internal code should use relative imports or be excluded via `ignores`.
