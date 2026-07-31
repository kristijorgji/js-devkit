import { Linter } from 'eslint';
import tseslint from 'typescript-eslint';
import { describe, expect, it } from 'vitest';

import { noPureTypeAlias } from '../src/rules/no-pure-type-alias.js';

const linter = new Linter({ version: '9.0.0' });

function lint(code: string, options?: Record<string, unknown>): Linter.LintMessage[] {
  return linter.verify(code, {
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
      },
    },
    plugins: {
      kj: {
        rules: {
          'no-pure-type-alias': noPureTypeAlias,
        },
      },
    },
    rules: {
      'kj/no-pure-type-alias': options ? ['error', options] : 'error',
    },
  });
}

describe('no-pure-type-alias', () => {
  it('flags pure identifier re-aliases', () => {
    const messages = lint('type Session = ApiLoginResponse;');
    expect(messages.some((message) => message.ruleId === 'kj/no-pure-type-alias')).toBe(true);
  });

  it('allows generics', () => {
    const messages = lint('type Result = Promise<string>;');
    expect(messages.filter((message) => message.ruleId === 'kj/no-pure-type-alias')).toEqual([]);
  });

  it('allows unions', () => {
    const messages = lint('type Status = "a" | "b";');
    expect(messages.filter((message) => message.ruleId === 'kj/no-pure-type-alias')).toEqual([]);
  });

  it('allows indexed access', () => {
    const messages = lint('type Email = User["email"];');
    expect(messages.filter((message) => message.ruleId === 'kj/no-pure-type-alias')).toEqual([]);
  });

  it('allows names matching allowPatterns', () => {
    const messages = lint('type SessionDto = ApiLoginResponse;', { allowPatterns: ['Dto$'] });
    expect(messages.filter((message) => message.ruleId === 'kj/no-pure-type-alias')).toEqual([]);
  });

  it('still flags names not matching allowPatterns', () => {
    const messages = lint('type Session = ApiLoginResponse;', { allowPatterns: ['Dto$'] });
    expect(messages.some((message) => message.ruleId === 'kj/no-pure-type-alias')).toBe(true);
  });
});
