import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { Linter } from 'eslint';
import tseslint from 'typescript-eslint';
import { afterEach, describe, expect, it } from 'vitest';

import {
  readSizeLimitsBaseline,
  SIZE_LIMITS_IGNORE_BASELINE_ENV,
  sizeLimits,
  type SizeLimitsOptions,
} from '../src/configs/size-limits.js';

const languageOptions: Linter.Config['languageOptions'] = {
  parser: tseslint.parser,
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
};

function statements(count: number): string {
  return Array.from({ length: count }, (_, i) => `export const v${i} = ${i};`).join('\n');
}

/** `max-lines-per-function` counts the signature and closing brace, so `count` is the reported total. */
function functionWithCountedLines(count: number): string {
  const body = Array.from({ length: count - 2 }, (_, i) => `  const x${i} = ${i};`).join('\n');
  return `export function f() {\n${body}\n}\n`;
}

function lint(code: string, filename: string, options?: SizeLimitsOptions): Linter.LintMessage[] {
  const linter = new Linter({ cwd: '/repo' });
  return linter.verify(
    code,
    [{ languageOptions }, ...sizeLimits({ cognitiveComplexity: false, ...options })],
    { filename: `/repo/${filename}` },
  );
}

function ruleMessages(messages: Linter.LintMessage[], ruleId: string): Linter.LintMessage[] {
  return messages.filter((message) => message.ruleId === ruleId);
}

describe('sizeLimits config shape', () => {
  it('registers sonarjs on the complexity block when sonarjsPlugin is given', () => {
    const configs = sizeLimits({ sonarjsPlugin: {} });
    const complexity = configs.find((config) => config.name === 'kj/size-limits/complexity');
    expect(complexity?.plugins?.sonarjs).toEqual({});
  });

  it('omits the complexity block when cognitiveComplexity is false', () => {
    const configs = sizeLimits({ cognitiveComplexity: false });
    expect(configs).toHaveLength(2);
    expect(configs.map((config) => config.name)).toEqual(['kj/size-limits/file', 'kj/size-limits/function']);
  });
});

describe('sizeLimits', () => {
  afterEach(() => {
    delete process.env[SIZE_LIMITS_IGNORE_BASELINE_ENV];
  });

  it('reports max-lines at 301 statements and not at 300', () => {
    expect(ruleMessages(lint(statements(301), 'src/a.ts'), 'max-lines')).not.toEqual([]);
    expect(ruleMessages(lint(statements(300), 'src/a.ts'), 'max-lines')).toEqual([]);
  });

  it('does not check files matching **/*.test.*', () => {
    expect(ruleMessages(lint(statements(301), 'src/a.test.ts'), 'max-lines')).toEqual([]);
  });

  it('reports max-lines-per-function at 81 lines and not at 80', () => {
    expect(ruleMessages(lint(functionWithCountedLines(81), 'src/a.ts'), 'max-lines-per-function')).not.toEqual([]);
    expect(ruleMessages(lint(functionWithCountedLines(80), 'src/a.ts'), 'max-lines-per-function')).toEqual([]);
  });

  it('functionIgnores skips max-lines-per-function on hook files but still applies max-lines', () => {
    const options: SizeLimitsOptions = { functionIgnores: ['**/use*.ts'] };
    expect(ruleMessages(lint(functionWithCountedLines(81), 'src/useX.ts', options), 'max-lines-per-function')).toEqual(
      [],
    );
    expect(ruleMessages(lint(statements(301), 'src/useX.ts', options), 'max-lines')).not.toEqual([]);
  });

  it('baseline raises the max-lines cap for a file', () => {
    const options: SizeLimitsOptions = { baseline: { 'src/a.ts': { 'max-lines': 310 } } };
    expect(ruleMessages(lint(statements(310), 'src/a.ts', options), 'max-lines')).toEqual([]);
    expect(ruleMessages(lint(statements(311), 'src/a.ts', options), 'max-lines')).not.toEqual([]);
  });

  it('escapes glob characters in baseline paths such as [locale]', () => {
    const options: SizeLimitsOptions = {
      baseline: { 'src/app/[locale]/page-data.ts': { 'max-lines': 310 } },
    };
    expect(ruleMessages(lint(statements(305), 'src/app/[locale]/page-data.ts', options), 'max-lines')).toEqual([]);
  });

  it('KJ_SIZE_LIMITS_IGNORE_BASELINE=1 ignores the exemption list', () => {
    process.env[SIZE_LIMITS_IGNORE_BASELINE_ENV] = '1';
    const options: SizeLimitsOptions = { baseline: { 'src/a.ts': { 'max-lines': 310 } } };
    expect(ruleMessages(lint(statements(305), 'src/a.ts', options), 'max-lines')).not.toEqual([]);
  });
});

describe('readSizeLimitsBaseline', () => {
  it('returns {} for a missing path', () => {
    expect(readSizeLimitsBaseline(path.join(os.tmpdir(), 'kj-size-limits-missing.json'))).toEqual({});
  });

  it('throws for a non-positive integer value', () => {
    const filePath = path.join(os.tmpdir(), `kj-size-limits-zero-${process.pid}.json`);
    fs.writeFileSync(filePath, '{"a.ts":{"max-lines":0}}');
    expect(() => readSizeLimitsBaseline(filePath)).toThrow(/positive integer/);
    fs.unlinkSync(filePath);
  });

  it('throws for an unknown rule', () => {
    const filePath = path.join(os.tmpdir(), `kj-size-limits-unknown-${process.pid}.json`);
    fs.writeFileSync(filePath, '{"a.ts":{"max-len":10}}');
    expect(() => readSizeLimitsBaseline(filePath)).toThrow(/unknown rule/);
    fs.unlinkSync(filePath);
  });
});
