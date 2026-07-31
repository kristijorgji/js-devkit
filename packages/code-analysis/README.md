# @kristijorgji/code-analysis

Repository code-analysis CLI (`kj-analyze`) for TypeScript/JavaScript codebases — starting with test-mock duplication detection, with room to grow into more analyzers.

## Install

```bash
npm install --save-dev @kristijorgji/code-analysis
# or
pnpm add -D @kristijorgji/code-analysis
```

## Usage

```bash
npx kj-analyze test-mocks
```

This scans your test files for `vi.mock(...)` / `jest.mock(...)` calls, groups occurrences of the same mocked module across files, and flags groups whose inline factories are identical or near-duplicate — good candidates for extracting into a shared mock helper. A markdown report is written to `reports/test-mock-usage/report.md` by default.

### Synopsis

```
kj-analyze <command> [options]

Commands:
  test-mocks   Find near-duplicate vi.mock/jest.mock factories

Options for test-mocks:
  --root <path>
  --scan <path>          (repeatable)
  --out <path>
  --min-occurrences <n>
  --min-lines <n>
  --similarity <0-1>
  --ignore <dirname>     (repeatable, appends to defaults)
  --help
```

### Flags

| Flag | Description | Default |
| ---- | ----------- | ------- |
| `--root <path>` | Repository root to analyze. | `process.cwd()` |
| `--scan <path>` | A path (relative to `--root`) to scan for test files. Repeatable. | Auto-detected (see below), else `src` |
| `--out <path>` | Where to write the markdown report (relative to `--root`). | `reports/test-mock-usage/report.md` |
| `--min-occurrences <n>` | Minimum number of non-delegating occurrences of a mocked module required to report it. | `2` |
| `--min-lines <n>` | Minimum number of lines a `mock(...)` call must span to be considered. | `8` |
| `--similarity <0-1>` | Jaccard similarity threshold above which two factories are considered near-duplicate. | `0.8` |
| `--ignore <dirname>` | A directory name to skip while walking. Repeatable; appends to the defaults. | `node_modules`, `dist`, `coverage` |
| `--help` | Print usage and exit. | |

When `--scan` is omitted and no config file specifies `scanPaths`, `kj-analyze` looks for a `pnpm-workspace.yaml` at the repo root. If it declares workspace packages, it scans for existing `apps/*/src` and `packages/*/src` directories. Otherwise it falls back to `src` if present, or scans nothing.

### Environment variables

Flags win over environment variables, which win over the config file, which wins over built-in defaults:

| Variable | Maps to |
| -------- | ------- |
| `MIN_OCCURRENCES` | `--min-occurrences` |
| `MIN_LINES` | `--min-lines` |
| `SIMILARITY_THRESHOLD` | `--similarity` |

## Config file

Drop a `code-analysis.config.json` at your repo root to set defaults without passing flags every time:

```json
{
  "scanPaths": ["src"],
  "minOccurrences": 2,
  "minLines": 8,
  "similarityThreshold": 0.8,
  "out": "reports/test-mock-usage/report.md",
  "ignoreDirectories": ["node_modules", "dist", "coverage", "e2e"],
  "pathAliases": {
    "~/": "src/"
  },
  "delegatePatterns": [
    "\\bcreate[A-Z]\\w*Mock\\w*\\s*\\(",
    "\\buseSharedMock\\("
  ]
}
```

| Key | Type | Description |
| --- | ---- | ----------- |
| `root` | `string` | Repository root override. |
| `scanPaths` | `string[]` | Paths (relative to root) to scan for `*.test.ts(x)` / `*.spec.ts(x)` files. |
| `minOccurrences` | `number` | Minimum non-delegating occurrences to report a group. |
| `minLines` | `number` | Minimum lines per `mock(...)` call to be considered. |
| `similarityThreshold` | `number` | Jaccard similarity threshold for "near-duplicate". |
| `out` | `string` | Report output path, relative to root. |
| `ignoreDirectories` | `string[]` | Directory names to skip while walking (replaces the built-in defaults; use `--ignore` to append instead). |
| `pathAliases` | `Record<string, string>` | Extra `prefix -> target` path aliases, used as a fallback when a scan root has no tsconfig `paths`. |
| `delegatePatterns` | `string[]` | Extra regex source strings identifying factories that delegate to a shared mock helper. |

**Precedence** (highest to lowest): **CLI flags > environment variables > config file > built-in defaults**.

## Programmatic API

```ts
import { analyzeTestMocks, formatReport } from '@kristijorgji/code-analysis';

const result = analyzeTestMocks({
    repoRoot: process.cwd(),
    scanPaths: ['src'],
    minOccurrences: 2,
    minLines: 8,
    similarityThreshold: 0.8,
});

const report = formatReport(result, {
    repoRoot: process.cwd(),
    minOccurrences: 2,
    minLines: 8,
});

console.log(report);
```

Other exports include `resolveMockModuleKey`, `factoryDelegatesToHelper`, `factoryJaccardSimilarity`, `hashFactoryBody`, `tokenizeFactory`, `jaccardSimilarity`, `listTestFiles`, `detectScanPaths`, `loadConfig`/`loadConfigFile`, `resolveConfig`/`resolveTestMocksConfig`, and the underlying path-alias and directory-walking helpers — see `src/index.ts` for the full surface.

## Example report (trimmed)

```markdown
# Test mock usage report

Scanned **42** test files.
Thresholds: >= **2** non-delegating occurrences, >= **8** lines per mock, near-duplicate >= **80%** similarity.

## expo-notifications

- Kind: package
- Status: **near-duplicate (max 92%)**
- Occurrences: 3 (3 non-delegating)
- Max lines: 6
- Closest pair (92%): `src/screens/a/A.test.ts:4` ↔ `src/screens/b/B.test.ts:4`

| File | Line | Lines | Delegates | Factory hash |
| ---- | ---- | ----- | --------- | ------------ |
| `src/screens/a/A.test.ts` | 4 | 6 | no | 3f9a1c2b9d0e |
| `src/screens/b/B.test.ts` | 4 | 6 | no | 7b2e0a44f1aa |
| `src/screens/c/C.test.ts` | 9 | 6 | no | 7b2e0a44f1aa |

## Already using shared mock helpers

These module groups have fewer than the required non-delegating inline mocks.

### react-i18next

- Kind: package
- Total occurrences: 5
- Delegating to shared helper: 5

| File | Line | Lines | Delegates |
| ---- | ---- | ----- | --------- |
| `src/hooks/useFoo.test.ts` | 3 | 1 | yes |
```

## License

MIT © kristijorgji
