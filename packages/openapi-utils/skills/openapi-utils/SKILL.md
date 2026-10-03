---
name: openapi-utils
description: >-
    Use when merging versioned OpenAPI documents, or adding another
    framework-agnostic OpenAPI helper to @kristijorgji/openapi-utils.
---

# openapi-utils

Library: `@kristijorgji/openapi-utils`. No CLI.

## Merge

`extractVersionPrefix(serverUrl, sourceName)` plus `mergeSpecs([{ name, versionPrefix, doc }, ...])`.

The first module is a versioned-spec merge. Example server variable: `{baseUrl}`. Keep app hosts, dump/fetch scripts, and Hono routers in the consumer.

`@kristijorgji/openapi-docs` generates route docs and Postman from one document. Do not fold that work into this package.

## Out of scope (this version)

Hono route registration, app server URLs, dump/fetch scripts, docs generation.
