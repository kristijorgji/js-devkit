---
'@kristijorgji/eslint-config-typescript': major
---

Fold `@kristijorgji/eslint-config-typescript` into the js-devkit monorepo as an ESM flat-config factory (`createTypescriptConfig`), built on `@kristijorgji/eslint-plugin`.

**Migration:** replace `extends` / FlatCompat usage with:

```js
import { createTypescriptConfig } from '@kristijorgji/eslint-config-typescript';
export default createTypescriptConfig({ tsconfigRootDir: import.meta.dirname });
```

Vendored from kristijorgji/eslint-config-typescript@702410cb. Breaking: CJS `index.cjs` removed; `eslint`/`typescript`/`prettier` are peers; import plugin is `eslint-plugin-import-x`.
