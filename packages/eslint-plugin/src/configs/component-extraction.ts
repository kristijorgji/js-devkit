import type { Linter } from 'eslint';

import { plugin } from '../plugin.js';

export interface ComponentExtractionOptions {
  severity?: 'warn' | 'error';
  /** Max lines per component function/arrow. Defaults to 70. */
  componentMaxLines?: number;
  /** Max lines per component file. Defaults to 300. */
  fileMaxLines?: number;
  /** Max lines per hook function. Defaults to 120. */
  hookMaxLines?: number;
  /** Glob patterns matching component files. Defaults to `['**\/*.tsx']`. */
  componentFiles?: string[];
  /** Glob patterns matching hook files. Defaults to `['**\/use*.ts', '**\/hooks/**\/*.ts']`. */
  hookFiles?: string[];
  /** Glob patterns excluded from all component-extraction checks. */
  ignores?: string[];
}

const DEFAULT_COMPONENT_MAX_LINES = 70;
const DEFAULT_FILE_MAX_LINES = 300;
const DEFAULT_HOOK_MAX_LINES = 120;
const DEFAULT_COMPONENT_FILES = ['**/*.tsx'];
const DEFAULT_HOOK_FILES = ['**/use*.ts', '**/hooks/**/*.ts'];
const DEFAULT_IGNORES = ['**/*.test.tsx', '**/*.stories.tsx', '**/*.test.ts', '**/*.stories.ts'];

/**
 * Encourages splitting large components/hooks into smaller modules: flags files with
 * more than one component (`kj/no-multi-comp`), components/files/hooks that exceed
 * configured line limits (`max-lines-per-function` / `max-lines`). Returns a fresh
 * array on every call.
 */
export function componentExtraction(options?: ComponentExtractionOptions): Linter.Config[] {
  const severity = options?.severity ?? 'warn';
  const componentMaxLines = options?.componentMaxLines ?? DEFAULT_COMPONENT_MAX_LINES;
  const fileMaxLines = options?.fileMaxLines ?? DEFAULT_FILE_MAX_LINES;
  const hookMaxLines = options?.hookMaxLines ?? DEFAULT_HOOK_MAX_LINES;
  const componentFiles = options?.componentFiles ?? DEFAULT_COMPONENT_FILES;
  const hookFiles = options?.hookFiles ?? DEFAULT_HOOK_FILES;
  const ignores = options?.ignores ?? DEFAULT_IGNORES;

  return [
    {
      files: componentFiles,
      ignores,
      plugins: { kj: plugin },
      rules: {
        'kj/no-multi-comp': severity,
      },
    },
    {
      files: componentFiles,
      ignores,
      rules: {
        'max-lines-per-function': [
          severity,
          { max: componentMaxLines, skipBlankLines: true, skipComments: true },
        ],
        'max-lines': [severity, { max: fileMaxLines, skipBlankLines: true, skipComments: true }],
      },
    },
    {
      files: hookFiles,
      ignores,
      rules: {
        'max-lines-per-function': [severity, { max: hookMaxLines, skipBlankLines: true, skipComments: true }],
      },
    },
  ];
}
