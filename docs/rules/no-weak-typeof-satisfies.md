# `kj/no-weak-typeof-satisfies`

Disallow `typeof expr` inside `satisfies` when `expr` resolves to `any` or `unknown`.

## Rationale

`satisfies NonNullable<typeof body>` looks precise but is useless when `body` is `any`/`unknown` (for example `await res.json()` without a typed helper). Prefer an exported API/domain type, `ReturnType` / `Awaited<ReturnType>`, or a named alias.

This rule is **type-aware** and needs `parserOptions.projectService` (or `project`). Use the `typed({ tsconfigRootDir })` config factory, or enable the rule in a type-aware block yourself.

## Incorrect

```ts
declare const res: { json(): Promise<any> };
const body = await res.json();
const expected = { ok: true } satisfies NonNullable<typeof body>;
```

## Correct

```ts
type LoginResponse = { data: { user: { email: string } } };
const expected = { email: 'a@b.c' } satisfies Partial<LoginResponse['data']['user']>;
```

## Options

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
| `allowUnknown` | `boolean` | `false` | When `true`, only flag `any` — `unknown` is allowed |

## When to disable

Temporary migrations of untyped JSON boundaries. Prefer typing the boundary instead.
