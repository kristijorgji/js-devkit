import fs from 'node:fs';

import type { ESLint, Linter } from 'eslint';

export const SIZE_LIMIT_RULES = ['max-lines', 'max-lines-per-function', 'sonarjs/cognitive-complexity'] as const;
export type SizeLimitRule = (typeof SIZE_LIMIT_RULES)[number];
/** Keys are paths relative to the ESLint config directory (posix separators). */
export type SizeLimitsBaseline = Record<string, Partial<Record<SizeLimitRule, number>>>;

export const SIZE_LIMITS_IGNORE_BASELINE_ENV = 'KJ_SIZE_LIMITS_IGNORE_BASELINE';
export const DEFAULT_SIZE_LIMITS_FILES = ['**/*.ts', '**/*.mts', '**/*.cts'];
export const DEFAULT_SIZE_LIMITS_IGNORES = [
  '**/*.test.*',
  '**/*.spec.*',
  '**/*.stories.*',
  '**/*.d.ts',
  '**/test/**',
  '**/tests/**',
  '**/__tests__/**',
  '**/__fixtures__/**',
  '**/__mocks__/**',
];
export const SIZE_LIMITS_DEFAULTS = { fileMaxLines: 300, functionMaxLines: 80, cognitiveComplexity: 20 } as const;

export interface SizeLimitsOptions {
  severity?: 'warn' | 'error';
  /** Defaults to `DEFAULT_SIZE_LIMITS_FILES`. */
  files?: string[];
  /** Replaces `DEFAULT_SIZE_LIMITS_IGNORES` when set. */
  ignores?: string[];
  fileMaxLines?: number;
  functionMaxLines?: number;
  /** `false` disables the sonarjs rule. */
  cognitiveComplexity?: number | false;
  /** Extra globs excluded from `max-lines-per-function` only (for example hook files governed elsewhere). */
  functionIgnores?: string[];
  /** Registered on the complexity block when given; otherwise `sonarjs` must be registered by another config. */
  sonarjsPlugin?: ESLint.Plugin;
  baseline?: SizeLimitsBaseline;
  /** Absolute path to a JSON exemption list; a missing file means no entries. */
  baselineFile?: string;
}

const LINE_OPTIONS = { skipBlankLines: true, skipComments: true } as const;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function escapeGlobPath(filePath: string): string {
  return filePath.replace(/[[\]{}()*?!+@]/g, '\\$&');
}

export function readSizeLimitsBaseline(filePath: string): SizeLimitsBaseline {
  if (!fs.existsSync(filePath)) return {};
  const parsed: unknown = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  if (!isPlainObject(parsed)) throw new Error(`${filePath}: size-limits baseline must be a JSON object`);
  for (const [file, entry] of Object.entries(parsed)) {
    if (!isPlainObject(entry)) throw new Error(`${filePath}: entry for ${file} must be an object`);
    for (const [rule, value] of Object.entries(entry)) {
      if (!(SIZE_LIMIT_RULES as readonly string[]).includes(rule)) {
        throw new Error(`${filePath}: unknown rule "${rule}" for ${file}`);
      }
      if (typeof value !== 'number' || !Number.isInteger(value) || value < 1) {
        throw new Error(`${filePath}: value for ${file} ${rule} must be a positive integer`);
      }
    }
  }
  return parsed as SizeLimitsBaseline;
}

function ruleEntry(rule: SizeLimitRule, severity: 'warn' | 'error', max: number): Linter.RuleEntry {
  if (rule === 'sonarjs/cognitive-complexity') return [severity, max];
  if (rule === 'max-lines-per-function') return [severity, { max, ...LINE_OPTIONS, IIFEs: true }];
  return [severity, { max, ...LINE_OPTIONS }];
}

/**
 * Line-count and cognitive-complexity limits for non-component modules, with a frozen
 * per-file exemption list (values may only shrink). Returns a fresh array on every call.
 */
export function sizeLimits(options?: SizeLimitsOptions): Linter.Config[] {
  const severity = options?.severity ?? 'error';
  const files = options?.files ?? DEFAULT_SIZE_LIMITS_FILES;
  const ignores = options?.ignores ?? DEFAULT_SIZE_LIMITS_IGNORES;
  const limits: Record<SizeLimitRule, number | false> = {
    'max-lines': options?.fileMaxLines ?? SIZE_LIMITS_DEFAULTS.fileMaxLines,
    'max-lines-per-function': options?.functionMaxLines ?? SIZE_LIMITS_DEFAULTS.functionMaxLines,
    'sonarjs/cognitive-complexity': options?.cognitiveComplexity ?? SIZE_LIMITS_DEFAULTS.cognitiveComplexity,
  };
  const configs: Linter.Config[] = [
    {
      name: 'kj/size-limits/file',
      files,
      ignores,
      rules: { 'max-lines': ruleEntry('max-lines', severity, limits['max-lines'] as number) },
    },
    {
      name: 'kj/size-limits/function',
      files,
      ignores: [...ignores, ...(options?.functionIgnores ?? [])],
      rules: {
        'max-lines-per-function': ruleEntry(
          'max-lines-per-function',
          severity,
          limits['max-lines-per-function'] as number,
        ),
      },
    },
  ];
  const complexity = limits['sonarjs/cognitive-complexity'];
  if (complexity !== false) {
    configs.push({
      name: 'kj/size-limits/complexity',
      files,
      ignores,
      ...(options?.sonarjsPlugin ? { plugins: { sonarjs: options.sonarjsPlugin } } : {}),
      rules: { 'sonarjs/cognitive-complexity': ruleEntry('sonarjs/cognitive-complexity', severity, complexity) },
    });
  }
  if (process.env[SIZE_LIMITS_IGNORE_BASELINE_ENV] === '1') return configs;

  const baseline: SizeLimitsBaseline = {
    ...(options?.baselineFile ? readSizeLimitsBaseline(options.baselineFile) : {}),
    ...options?.baseline,
  };
  for (const file of Object.keys(baseline).sort()) {
    const rules: Linter.RulesRecord = {};
    for (const rule of SIZE_LIMIT_RULES) {
      const value = baseline[file]?.[rule];
      const limit = limits[rule];
      if (value === undefined || limit === false) continue;
      rules[rule] = ruleEntry(rule, severity, Math.max(value, limit));
    }
    if (Object.keys(rules).length > 0) {
      configs.push({ name: `kj/size-limits/baseline:${file}`, files: [escapeGlobPath(file)], rules });
    }
  }
  return configs;
}
