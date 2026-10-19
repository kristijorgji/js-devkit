---
name: public-packages
description: >-
  Keep js-devkit packages consumer-agnostic for public npm. Use when adding or
  editing packages, tests, README examples, fixtures, skills, or changesets so
  they never name a specific consuming app.
---

# Public packages

Every package in this repo is a **public npm library**. A consuming app (for example Prona365) is not part of the package contract.

## Do not ship consumer details

Do not put a specific consumer's name, product brand, hosts, locales, auth labels, routes, or fixtures in:

- source
- tests (including `describe` / `it` titles)
- README examples
- committed fixtures
- package-shipped skills

"Consumer" as a common noun is fine. Naming Prona365, or any other app, is not.

## What to use instead

| Instead of | Use |
| --- | --- |
| `Prona365`, app hostnames, brand copy | `my-app`, `Acme`, `@repo/web`, `example.com` |
| A consumer's real config as the spec | A generic example that exercises the public API |
| `describe('… (Prona365 lock)')` | `describe('preset pnpm argv')` |

Keep app-specific names, auth, SEO, CDN prefixes, and env vars in the **consumer** config. Packages already follow this in `@kristijorgji/openapi-docs`, `@kristijorgji/next-route-docs`, and `@kristijorgji/next-bundle-budget`.

## Tests

Behavior locks belong on the public API (argv, HTML, OpenAPI output), not on a named app.

A test **may** assert that published or rendered output does **not** contain a known consumer brand (`expect(html).not.toContain('Prona365')`). That is a guard, not a product reference.
