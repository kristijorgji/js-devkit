# `kj/no-pure-type-alias`

Discourage pure type re-aliases like `type A = B` (identifier alias with no generics or indexing).

## Rationale

A bare alias adds a name without adding meaning and often drifts from the real domain type. Prefer the original type, or a type that composes/transforms it (`Promise<T>`, `Partial<T>`, indexed access, unions).

## Incorrect

```ts
type Session = ApiLoginResponse;
```

## Correct

```ts
type Result = Promise<string>;
type Email = User['email'];
type Status = 'a' | 'b';
```

## Options

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
| `allowPatterns` | `string[]` | `[]` | Regex patterns; aliases whose **name** matches any pattern are allowed |

## When to disable

Branded or publicly re-exported aliases that are intentional API surface. Prefer `allowPatterns` or a targeted `eslint-disable-next-line` with a reason.
