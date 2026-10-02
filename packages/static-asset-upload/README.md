# @kristijorgji/static-asset-upload

Upload a caller-supplied static-asset manifest to S3-compatible object storage (AWS S3, Cloudflare R2, MinIO). Framework-agnostic: there is no Next.js peer and no default `web/` or `_next/` prefix.

The package plans files from local directories, maps Cache-Control and Content-Type, and puts objects. CDN layout, env wiring, and prune/invalidation stay in the app.

## Install

```bash
pnpm add -D @kristijorgji/static-asset-upload
```

## Setup

Create `static-assets.config.ts` at the app root (discovered upward as `.ts`, `.mts`, `.js`, or `.mjs`):

```ts
import { defineStaticAssetsConfig } from '@kristijorgji/static-asset-upload/config';

export default defineStaticAssetsConfig({
    root: import.meta.dirname,
    bucket: process.env.ASSETS_BUCKET!,
    region: process.env.S3_REGION ?? 'auto',
    commit: process.env.APP_VERSION!,
    endpoint: process.env.S3_ENDPOINT,
    forcePathStyle: Boolean(process.env.S3_ENDPOINT),
    commitPrefix: 'assets/{commit}',
    sharedPrefix: 'assets/shared',
    requiredTargetIds: ['hashed-static'],
    validateCommit: (commit) => {
        if (!/^[0-9a-f]{7,40}$/i.test(commit)) {
            throw new Error('commit must be a git hash (7–40 hex characters)');
        }
    },
    targets: [
        {
            id: 'hashed-static',
            localDir: 'dist/static',
            remotePrefix: '{commitPrefix}/static',
            versioning: 'commit',
            cacheControl: 'public, max-age=31536000, immutable',
        },
        {
            id: 'public-icons',
            localDir: 'public',
            remotePrefix: '{sharedPrefix}',
            versioning: 'shared',
            cacheControl: 'public, max-age=10800',
            include: ['icon.png'],
            exclude: ['sw.js'],
            optional: true,
        },
    ],
});
```

Add a script:

```json
{
  "scripts": {
    "assets:upload": "kj-static-assets upload",
    "assets:upload:dry": "kj-static-assets upload --dry-run"
  }
}
```

AWS credentials use the standard SDK chain. Set `endpoint` (and usually `forcePathStyle`) for R2 or MinIO.

## Commands

| Command | Flags | When |
| --- | --- | --- |
| `upload` | `--dry-run` | Put planned objects, or print the plan and exit 0 |

## Config

| Field | Default | Purpose |
| --- | --- | --- |
| `root` | required | App directory; `localDir` values are relative to this |
| `bucket` | required | Destination bucket |
| `commit` | required | Substituted into `{commit}` in prefixes |
| `commitPrefix` / `sharedPrefix` | required | Remote key prefixes; `{commit}` is expanded |
| `targets` | required | Directories to walk |
| `region` | `us-east-1` | Passed to the S3 client (`auto` is valid for R2) |
| `endpoint` | unset | S3-compatible API URL |
| `forcePathStyle` | `false` | Path-style addressing for MinIO / some R2 setups |
| `targetIds` | all targets | Limit the plan to these target ids |
| `requiredTargetIds` | `[]` | Fail if a listed target produces no files |
| `validateCommit` | no-op | Optional commit-format check |

Each target sets its own `cacheControl` string. `{commitPrefix}` and `{sharedPrefix}` in `remotePrefix` are expanded by the planner.

## Programmatic API

```ts
import {
    assertRequiredTargets,
    defineStaticAssetsConfig,
    resolveUploadPlan,
    runStaticAssetUpload,
} from '@kristijorgji/static-asset-upload';

const config = defineStaticAssetsConfig({ /* ... */ });
const plan = resolveUploadPlan(config);
assertRequiredTargets(plan, config);
await runStaticAssetUpload(config, { dryRun: true });
```

`runStaticAssetUpload` constructs an `S3Client` from `region` / `endpoint` / `forcePathStyle`. Tests can pass `{ client: { send } }` instead.

Plan entries use `remoteKey` (object key), not a vendor-specific field name.

## License

MIT
