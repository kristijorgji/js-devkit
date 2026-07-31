import { RuleTester } from '@typescript-eslint/rule-tester';
import { afterAll, describe, it } from 'vitest';

import { jsxLeadingPropOrder } from '../src/rules/jsx-leading-prop-order.js';

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester({
  languageOptions: {
    parserOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      ecmaFeatures: { jsx: true },
    },
  },
});

ruleTester.run('jsx-leading-prop-order', jsxLeadingPropOrder, {
  valid: [
    { code: `const el = <div data-testid="a" id="b" className="c" />;` },
    { code: `const el = <div className="c" other="d" />;` },
    { code: `const el = <div {...rest} data-testid="a" className="c" />;` },
    { code: `const el = <div data-testid="a" {...rest} id="b" />;` },
    {
      code: `const el = <div className="c" data-testid="a" />;`,
      options: [{ order: ['className'] }],
    },
  ],
  invalid: [
    {
      code: `const el = <div id="b" data-testid="a" />;`,
      output: `const el = <div data-testid="a" id="b" />;`,
      errors: [{ messageId: 'outOfOrder' }],
    },
    {
      code: `const el = <div ref={r} data-testid="a" key="k" />;`,
      output: `const el = <div data-testid="a" key="k" ref={r} />;`,
      errors: [{ messageId: 'outOfOrder' }],
    },
    {
      code: `const el = <div {...rest} id="b" data-testid="a" />;`,
      output: `const el = <div {...rest} data-testid="a" id="b" />;`,
      errors: [{ messageId: 'outOfOrder' }],
    },
  ],
});
