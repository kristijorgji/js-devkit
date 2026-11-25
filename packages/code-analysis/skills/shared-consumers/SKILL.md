---
name: shared-consumers
description: >
  Keep shared-package files used by at least two consumers. Use when kj-analyze
  shared-consumers reports a single-consumer file, when adding code to a shared
  utils package, or when deciding whether a helper belongs in apps/ or packages/.
---

# Shared consumers

A file in a configured shared package (for example `@repo/utils`) must be used
by two or more consumer workspaces, or by a designated shared consumer such as
`packages/ui` or `packages/query`. Barrels (`index.ts` files that only re-export)
are excluded. Indirect use counts: if `a.ts` is imported by two apps and `a.ts`
imports `helper.ts`, `helper.ts` also has two consumers.

## When a file fails

1. **Move it** to the single consumer (`apps/<app>/src/lib/<domain>/` or the
   consumer package). Update imports. Do not leave a re-export in the shared
   package.
2. **Do not** add it to the exemption list just to silence the gate.

## When an exemption is justified

Add a baseline entry only when the file is a genuine platform entrypoint (for
example separate web/mobile/edge adapters over shared core). The `reason` field
must say why it stays. Run `kj-analyze shared-consumers --write-baseline` and
then edit the generated TODO reason.

## Stale entries

If the command says a baseline key no longer violates, remove it from the list.
Do not keep historical exemptions.
