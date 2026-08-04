---
'@kristijorgji/eslint-config-react-typescript': minor
'@kristijorgji/eslint-config-typescript': patch
---

When `explicitTypes` enables `explicit-function-return-type`, `createReactConfig` turns that rule off for `.tsx`/`.jsx` (JSX return types are inferred). Document the React-factory default and scrub private adopter names from public kit docs/comments/tests. Republishing react-config also floors the typescript-config dependency at the current workspace minor.
