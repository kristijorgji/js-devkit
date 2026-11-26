---
'@kristijorgji/eslint-config-typescript': major
'@kristijorgji/eslint-config-react-typescript': major
---

Enable type-aware async-safety rules by default when `tsconfigRootDir` is set (`no-floating-promises`, `no-misused-promises`, `await-thenable`, `switch-exhaustiveness-check` with default-as-exhaustive). Configure with `asyncSafety` (`false` or per-rule object). `createReactConfig` defaults `jsxAttributes: false` so async JSX handlers are allowed.
