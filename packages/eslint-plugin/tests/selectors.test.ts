import { Linter } from 'eslint';
import tseslint from 'typescript-eslint';
import { describe, expect, it } from 'vitest';

import { mockBodySatisfiesSelectors } from '../src/selectors/mock-body-satisfies.js';
import { objectLiteralTypingSelectors } from '../src/selectors/object-literal-typing.js';
import { restrictedSyntax, restrictedSyntaxRuleEntry } from '../src/selectors/restricted-syntax.js';

const linter = new Linter({ version: '9.0.0' });

function lint(code: string, ruleConfig: Linter.RuleEntry): Linter.LintMessage[] {
  return linter.verify(code, {
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
      },
    },
    rules: {
      'no-restricted-syntax': ruleConfig,
    },
  });
}

function expectRestricted(code: string, ruleConfig: Linter.RuleEntry): void {
  const messages = lint(code, ruleConfig);
  expect(messages.some((message) => message.ruleId === 'no-restricted-syntax')).toBe(true);
}

function expectAllowed(code: string, ruleConfig: Linter.RuleEntry): void {
  const messages = lint(code, ruleConfig);
  expect(messages.filter((message) => message.ruleId === 'no-restricted-syntax')).toEqual([]);
}

describe('restrictedSyntax', () => {
  it('collects entries from all provided groups', () => {
    const entries = restrictedSyntax([objectLiteralTypingSelectors, mockBodySatisfiesSelectors]);
    expect(entries.length).toBe(
      Object.keys(objectLiteralTypingSelectors).length + Object.keys(mockBodySatisfiesSelectors).length,
    );
  });

  it('excludes entries by key', () => {
    const entries = restrictedSyntax([objectLiteralTypingSelectors], { exclude: ['jsxBinding'] });
    expect(entries).not.toContainEqual(objectLiteralTypingSelectors.jsxBinding);
    expect(entries.length).toBe(Object.keys(objectLiteralTypingSelectors).length - 1);
  });

  it('appends extra entries', () => {
    const extra = { selector: 'DebuggerStatement', message: 'no debugger' };
    const entries = restrictedSyntax([objectLiteralTypingSelectors], { extra: [extra] });
    expect(entries[entries.length - 1]).toEqual(extra);
  });

  it('returns a fresh array on every call', () => {
    const a = restrictedSyntax([objectLiteralTypingSelectors]);
    const b = restrictedSyntax([objectLiteralTypingSelectors]);
    expect(a).not.toBe(b);
    expect(a).toEqual(b);
  });
});

describe('restrictedSyntaxRuleEntry', () => {
  it('defaults to error severity', () => {
    const [severity] = restrictedSyntaxRuleEntry([objectLiteralTypingSelectors]);
    expect(severity).toBe('error');
  });

  it('accepts a custom severity', () => {
    const [severity] = restrictedSyntaxRuleEntry([objectLiteralTypingSelectors], undefined, 'warn');
    expect(severity).toBe('warn');
  });
});

describe('composed object literal typing rules', () => {
  const ruleConfig = restrictedSyntaxRuleEntry([objectLiteralTypingSelectors]);

  it('flags untyped const object literals', () => {
    expectRestricted('const mock = { id: "1" };', ruleConfig);
  });

  it('allows annotated const object literals', () => {
    expectAllowed('const x: Record<string, never> = {};', ruleConfig);
  });
});

describe('composed mock body satisfies rules', () => {
  const ruleConfig = restrictedSyntaxRuleEntry([mockBodySatisfiesSelectors]);

  it('flags bare inline mockReturnValue object literals', () => {
    expectRestricted('mock.mockReturnValue({ id: "1" });', ruleConfig);
  });

  it('allows inline mock bodies with satisfies', () => {
    expectAllowed('type R = { id: string }; mock.mockReturnValue({ id: "1" } satisfies R);', ruleConfig);
  });

  it('excluded selectors no longer fire', () => {
    const excludedConfig = restrictedSyntaxRuleEntry([mockBodySatisfiesSelectors], {
      exclude: ['mockReturnResolvedValue'],
    });
    expectAllowed('mock.mockReturnValue({ id: "1" });', excludedConfig);
  });
});
