# `kj/jsx-leading-prop-order`

Require configured leading JSX attributes to appear in a fixed order. Other props stay unordered relative to each other (stable sort by rank). Never moves attributes across `JSXSpreadAttribute` boundaries.

## Rationale

Putting identity and test selectors first (`data-testid`, `testID`, `key`, `ref`, …) makes components easier to scan and keeps autofixes predictable.

## Incorrect

```tsx
<Button type="button" data-testid={ids.submit} />
```

## Correct

```tsx
<Button data-testid={ids.submit} type="button" />
```

## Options

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
| `order` | `string[]` | `['data-testid', 'testID', 'key', 'ref', 'id', 'name']` | Leading attribute names in desired order |

Auto-fixable.

## When to disable

Generated JSX or third-party code where prop order is dictated by another formatter.
