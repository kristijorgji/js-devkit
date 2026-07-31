import { RuleTester } from '@typescript-eslint/rule-tester';
import { afterAll, describe, it } from 'vitest';

import { noSingleExportBarrel } from '../src/rules/no-single-export-barrel.js';

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

ruleTester.run('no-single-export-barrel', noSingleExportBarrel, {
  valid: [
    {
      filename: '/repo/src/components/Foo/index.ts',
      code: `export { Foo } from './Foo';\nexport { Bar } from './Bar';\n`,
    },
    {
      filename: '/repo/src/components/Foo/index.ts',
      code: `export { createFoo } from './createFoo';\n`,
    },
    {
      filename: '/repo/src/components/Foo/Foo.ts',
      code: `export { Foo } from './Foo';\n`,
    },
    {
      filename: '/repo/src/lib/routing/index.ts',
      code: `export { AppLink } from './AppLink';\nexport { useLocale } from './useLocale';\n`,
    },
    {
      filename: '/repo/src/components/Foo/index.ts',
      code: `export { Foo } from './Foo';\n`,
      options: [{ exportNamePattern: '^create' }],
    },
  ],
  invalid: [
    {
      filename: '/repo/src/components/Foo/index.ts',
      code: `export { Foo } from './Foo';\n`,
      errors: [{ messageId: 'noSingleExportBarrel' }],
    },
    {
      filename: '/repo/src/components/Bar/index.ts',
      code: `export { MapPickerDynamic } from './MapPickerDynamic';\n`,
      errors: [{ messageId: 'noSingleExportBarrel' }],
    },
    {
      filename: '/repo/src/components/Foo/index.ts',
      code: `export { createFoo } from './createFoo';\n`,
      options: [{ exportNamePattern: '^create' }],
      errors: [{ messageId: 'noSingleExportBarrel' }],
    },
  ],
});
