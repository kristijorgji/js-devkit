---
'@kristijorgji/next-bundle-budget': patch
---

Subtract the shared Turbopack first-load shell from App Router page-owned chunks so size-limit route budgets do not include runtime/vendor.
