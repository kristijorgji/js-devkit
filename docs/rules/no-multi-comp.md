# `kj/no-multi-comp`

Disallow more than one PascalCase React component in a single file.

## Rationale

Multiple components in one file make ownership, testing, and Storybook stories harder to navigate. Prefer one exported component per module (helpers and hooks in the same file are fine when they are not PascalCase components).

## Incorrect

```tsx
export function Button() {
  return <button />;
}
function Icon() {
  return <span />;
}
```

## Correct

```tsx
export function Button() {
  return <button />;
}
function helper() {
  return null;
}
```

## Options

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
| `max` | `number` | `1` | Maximum number of components allowed per file |
| `ignoreStateless` | `boolean` | `false` | When `true`, only count `ClassDeclaration` components |

## When to disable

Rare co-located private subcomponents that are not worth their own file. Prefer extracting first; disable with a one-line reason if extraction would be worse.
