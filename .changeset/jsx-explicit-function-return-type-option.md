---
'@kristijorgji/eslint-config-react-typescript': minor
'@kristijorgji/eslint-config-typescript': patch
---

Add `jsxExplicitFunctionReturnType` so adopters can keep
`explicit-function-return-type` on for `.tsx`/`.jsx` when `explicitTypes`
enables that rule. Default remains `false` (rule off for JSX; returns inferred).
Document the option from the typescript-config README cross-link.
