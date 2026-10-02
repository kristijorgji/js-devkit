---
name: static-asset-upload
description: >-
    Use when uploading hashed or shared static files to S3-compatible storage
    from a caller-supplied manifest, or wiring kj-static-assets into a new project.
---

# static-asset-upload

CLI: `kj-static-assets` from `@kristijorgji/static-asset-upload`.

## Commands

| Command | Flags | When |
| --- | --- | --- |
| `upload` | `--dry-run` | Put planned objects, or print the plan |

## Config

`static-assets.config.ts` via `defineStaticAssetsConfig({ root, bucket, commit, commitPrefix, sharedPrefix, targets, ... })`.

Keep app-specific CDN prefixes, env names, and cache lifetimes in the consumer config. Do not hardcode them in this package.

Example prefixes: `commitPrefix: 'assets/{commit}'`, `sharedPrefix: 'assets/shared'`.

Each target supplies `cacheControl` as a header string. There is no package-level 1y/3h enum.

`runStaticAssetUpload` builds the S3 client from `region` / `endpoint` / `forcePathStyle`. Inject `{ client: { send } }` in tests. No live AWS.

## Out of scope

Prune, CloudFront invalidation, and extra storage backends. An S3-compatible `endpoint` is enough for R2 and MinIO.
