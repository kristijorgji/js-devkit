import { Linter } from 'eslint';
import tseslint from 'typescript-eslint';
import { describe, expect, it } from 'vitest';

import { noMultiComp } from '../src/rules/no-multi-comp.js';

const linter = new Linter({ version: '9.0.0' });

function lint(code: string, options?: Record<string, unknown>): Linter.LintMessage[] {
  return linter.verify(code, {
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      kj: {
        rules: {
          'no-multi-comp': noMultiComp,
        },
      },
    },
    rules: {
      'kj/no-multi-comp': options ? ['warn', options] : 'warn',
    },
  });
}

describe('no-multi-comp', () => {
  it('allows a single component', () => {
    const messages = lint(`
      export function Button() {
        return null;
      }
    `);
    expect(messages.filter((message) => message.ruleId === 'kj/no-multi-comp')).toEqual([]);
  });

  it('flags a second component in the same file', () => {
    const messages = lint(`
      export function Button() {
        return null;
      }
      function Icon() {
        return null;
      }
    `);
    expect(messages.some((message) => message.ruleId === 'kj/no-multi-comp')).toBe(true);
  });

  it('ignores lowercase helpers', () => {
    const messages = lint(`
      function helper() {
        return null;
      }
      export function Button() {
        return null;
      }
    `);
    expect(messages.filter((message) => message.ruleId === 'kj/no-multi-comp')).toEqual([]);
  });

  it('flags class components too', () => {
    const messages = lint(`
      export function Button() {
        return null;
      }
      class Icon {}
    `);
    expect(messages.some((message) => message.ruleId === 'kj/no-multi-comp')).toBe(true);
  });

  it('respects a higher max option', () => {
    const messages = lint(
      `
        export function Button() { return null; }
        function Icon() { return null; }
      `,
      { max: 2 },
    );
    expect(messages.filter((message) => message.ruleId === 'kj/no-multi-comp')).toEqual([]);
  });

  it('with ignoreStateless only counts class components', () => {
    const messages = lint(
      `
        export function Button() { return null; }
        const Icon = () => null;
        function Avatar() { return null; }
      `,
      { ignoreStateless: true },
    );
    expect(messages.filter((message) => message.ruleId === 'kj/no-multi-comp')).toEqual([]);
  });

  it('with ignoreStateless still flags multiple class components', () => {
    const messages = lint(
      `
        class Button {}
        class Icon {}
      `,
      { ignoreStateless: true },
    );
    expect(messages.some((message) => message.ruleId === 'kj/no-multi-comp')).toBe(true);
  });
});
