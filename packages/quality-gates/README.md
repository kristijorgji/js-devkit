# @kristijorgji/quality-gates

Configurable quality-gate runner for JavaScript monorepos. One gate list drives both Husky pre-commit and agent working-tree checks: sequential execution, `dependsOn`, an isolated git index so working-tree lint-staged never touches the real index, and a summary with cited files and exact rerun commands.

The package does not own lint-staged rules, knip config, or turbo task graphs. Those stay in the consumer. Gates are `{ id, command }` objects; optional presets return those objects for common tools.

## Install

```bash
pnpm add -D @kristijorgji/quality-gates
```

## Setup

Create `quality-gates.config.ts` at the repo root (discovered upward as `.ts`, `.mts`, `.js`, or `.mjs`):

```ts
import {
    defineQualityGatesConfig,
    knip,
    lintStaged,
    turboTask,
    workspaceScript,
} from '@kristijorgji/quality-gates/config';

export default defineQualityGatesConfig({
    packageManager: 'pnpm',
    packageRoots: ['apps', 'packages'],
    gates: [
        lintStaged(),
        knip(),
        turboTask({ id: 'typecheck', task: 'typecheck', modes: ['working-tree'] }),
        turboTask({ id: 'build', task: 'build', dependsOn: ['typecheck'] }),
        workspaceScript({
            id: 'size-limit',
            workspace: '@repo/web',
            script: 'size-limit',
            dependsOn: ['build'],
            whenChanged: ['apps/web/', 'packages/utils/'],
            envByMode: { 'pre-commit': { TRACK_BUNDLE_HISTORY: '1' } },
        }),
    ],
});
```

Custom gates may ignore presets and return a literal `{ cmd, args, env }`.

Root scripts (Husky and agents keep these names):

```json
{
  "scripts": {
    "quality:pre-commit": "kj-quality-gates --mode pre-commit",
    "quality:working-tree": "kj-quality-gates --mode working-tree"
  }
}
```

`.husky/pre-commit` should only run `pnpm quality:pre-commit` (or the equivalent for your package manager).

## Modes

| Mode | File set | Fail-fast | Index |
| --- | --- | --- | --- |
| `pre-commit` | staged ACMR | yes | real index (lint-staged may restage) |
| `working-tree` | vs HEAD + untracked | no (run all planned) | isolated temp index; exit 2 if the real index changes |

## CLI

```bash
kj-quality-gates --mode pre-commit
kj-quality-gates --mode working-tree
kj-quality-gates --mode working-tree --files <path...>
kj-quality-gates --mode working-tree --gates <id>[,<id>...]
kj-quality-gates --mode working-tree --config ./quality-gates.config.ts
```

`--files` and `--gates` are working-tree only and mutually exclusive. `--files` runs only `scope: 'files'` gates.

Exit codes: `0` all planned gates passed, `1` a gate failed, `2` usage error or index guard.

Logs: `<logDir>/<mode>/<gate-id>.txt` (default log dir `.quality-gates`). The directory is wiped at the start of each run.

## Config

| Field | Default | Purpose |
| --- | --- | --- |
| `packageManager` | `auto` | `pnpm` / `npm` / `yarn` / `bun`, or detect from `package.json#packageManager` then lockfile |
| `packageRoots` | `['apps', 'packages']` | Roots used to map turbo/tsc package-relative paths in failure output |
| `logDir` | `.quality-gates` | Per-gate log directory under the repo root |
| `workingTreeScript` | `<pm> quality:working-tree` | Prefix for printed rerun commands |
| `gates` | required | Ordered gate list (unique `id`s) |

`auto` detection fails with a clear error if neither `packageManager` nor a known lockfile is present.

## Presets

| Helper | Typical use |
| --- | --- |
| `lintStaged()` | `scope: 'files'`, isolated index; working-tree uses `--diff <diffBase\|HEAD>` (never pathspecs) |
| `knip({ via?: 'script' \| 'bin' })` | Default `via: 'script'` → `pnpm knip` |
| `turboTask({ id, task, modes?, dependsOn?, affected? })` | Default `affected: true` → `--filter=...[HEAD]` when HEAD exists |
| `workspaceScript({ id, workspace, script, whenChanged?, envByMode?, dependsOn? })` | Filter by changed-path prefixes; optional env per mode |

Presets only return `Gate` objects. They are not a second API.

## Package managers

Preset argv (unit-tested; other managers besides pnpm are best-effort):

| | exec bin | root script | workspace script |
| --- | --- | --- | --- |
| pnpm | `pnpm exec <bin>` | `pnpm <script>` | `pnpm --filter <ws> <script>` |
| npm | `npx --no-install <bin>` | `npm run <script>` | `npm run <script> -w <ws>` |
| yarn | `yarn <bin>` | `yarn <script>` | `yarn workspace <ws> <script>` |
| bun | `bunx <bin>` | `bun run <script>` | `bun run --filter <ws> <script>` |

## Feature contract

- Sequential gates; `dependsOn` skips when a planned dependency failed or was skipped
- File-scoped rerun: `<workingTreeScript> --files …` when the failed gate has `scope: 'files'` and cited files
- Otherwise: `<workingTreeScript> --gates <id>`
- Cited files: exact repo-relative path wins; `{packageRoot}/{pkg}/…` fallback for turbo/tsc
- Working-tree lists files auto-fixed during the run (unstaged)

## License

MIT
