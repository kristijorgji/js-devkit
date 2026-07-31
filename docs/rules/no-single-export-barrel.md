# `kj/no-single-export-barrel`

Disallow thin `index.ts` / `index.tsx` barrels that only re-export a single PascalCase symbol from a sibling module.

## Rationale

A one-line `export { Foo } from './Foo'` barrel adds indirection without grouping value. Import the module file directly and delete the barrel. Multi-export domain barrels remain allowed.

The rule only runs on files named `index.ts` or `index.tsx`.

## Incorrect

```ts
// src/components/Foo/index.ts
export { Foo } from './Foo';
```

## Correct

```ts
// src/components/Foo/index.ts
export { Foo } from './Foo';
export { Bar } from './Bar';
```

```ts
// Non-index file — ignored
export { Foo } from './Foo';
```

```ts
// Lowercase export name — ignored by default pattern
export { createFoo } from './createFoo';
```

## Options

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
| `exportNamePattern` | `string` | `"^[A-Z]"` | Regex; only export names matching this pattern are flagged |

## When to disable

Framework entrypoints that must be `index.ts` for tooling reasons. Prefer changing `exportNamePattern` if your naming convention differs.
