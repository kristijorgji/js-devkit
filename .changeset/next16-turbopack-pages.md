---
"@kristijorgji/next-bundle-budget": patch
---

Fix the Next 16 Turbopack adapter on pages-router builds: read page-owned chunks from build-manifest.json when /_app is present (route-bundle-stats.json is first-load, not page-owned), fall back shared vendor to /_app, and strip a leading .next/ so size-limit globs are not doubled.
