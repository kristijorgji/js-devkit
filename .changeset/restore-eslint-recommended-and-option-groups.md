---
'@kristijorgji/eslint-config-typescript': minor
---

Restore typescript-eslint's `eslint-recommended` overrides in `baseRules` so TS-redundant core rules (`no-undef`, `no-redeclare`, `no-dupe-class-members`, …) stay disabled for `.ts`/`.tsx`, and add opt-in `codeQuality` / `explicitTypes` groups (with standalone `createCodeQualityConfig` / `createExplicitTypesConfig` for non-factory presets).
