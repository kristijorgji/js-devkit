import { RuleTester } from '@typescript-eslint/rule-tester';
import { afterAll, describe, it } from 'vitest';

import { noBarrel } from '../src/rules/no-barrel.js';

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester({
  languageOptions: {
    parserOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
    },
  },
});

const options = [{ packageName: '@repo/utils', exampleSubpath: '@repo/utils/media' }];

ruleTester.run('no-barrel', noBarrel, {
  valid: [
    { code: `import { formatDate } from '@repo/utils/media';`, options },
    { code: `import { formatDate } from 'other-package';`, options },
    { code: `export { formatDate } from '@repo/utils/media';`, options },
    { code: `export * from '@repo/utils/media';`, options },
  ],
  invalid: [
    {
      code: `import { formatDate } from '@repo/utils';`,
      options,
      errors: [{ messageId: 'noBarrel' }],
    },
    {
      code: `export { formatDate } from '@repo/utils';`,
      options,
      errors: [{ messageId: 'noBarrel' }],
    },
    {
      code: `export * from '@repo/utils';`,
      options,
      errors: [{ messageId: 'noBarrel' }],
    },
  ],
});
