import { RuleTester } from '@typescript-eslint/rule-tester';
import { afterAll, describe, it } from 'vitest';

import { noWeakTypeofSatisfies } from '../src/rules/no-weak-typeof-satisfies.js';

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

const ruleTester = new RuleTester({
  languageOptions: {
    parserOptions: {
      projectService: {
        allowDefaultProject: ['*.ts'],
      },
    },
  },
});

ruleTester.run('no-weak-typeof-satisfies', noWeakTypeofSatisfies, {
  valid: [
    {
      code: `
        type User = { email: string };
        const result: User = { email: 'a@b.c' };
        const expected = { email: 'a@b.c' } satisfies NonNullable<typeof result>;
        void expected;
      `,
    },
    {
      code: `
        type LoginResponse = { data: { user: { email: string } } };
        const body: LoginResponse = { data: { user: { email: 'a@b.c' } } };
        const expected = { email: 'a@b.c' } satisfies Partial<typeof body.data.user>;
        void expected;
      `,
    },
    {
      code: `
        type LoginResponse = { data: { user: { email: string } } };
        const expected = { email: 'a@b.c' } satisfies Partial<LoginResponse['data']['user']>;
        void expected;
      `,
    },
    {
      code: `
        const payload: unknown = { id: '1' };
        const expected = { id: '1' } satisfies NonNullable<typeof payload>;
        void expected;
      `,
      options: [{ allowUnknown: true }],
    },
  ],
  invalid: [
    {
      code: `
        declare const res: { json(): Promise<any> };
        async function run(): Promise<void> {
          const body = await res.json();
          const expected = { ok: true } satisfies NonNullable<typeof body>;
          void expected;
        }
        void run;
      `,
      errors: [{ messageId: 'weakTypeof' }],
    },
    {
      code: `
        const body: any = { data: { user: { email: 'a' } } };
        const expected = { email: 'a' } satisfies Partial<NonNullable<typeof body.data.user>>;
        void expected;
      `,
      errors: [{ messageId: 'weakTypeof' }],
    },
    {
      code: `
        const payload: unknown = { id: '1' };
        const expected = { id: '1' } satisfies NonNullable<typeof payload>;
        void expected;
      `,
      errors: [{ messageId: 'weakTypeof' }],
    },
    {
      code: `
        const body: any = { data: { user: { email: 'a' } } };
        const expected = { email: 'a' } satisfies Partial<NonNullable<typeof body.data.user>>;
        void expected;
      `,
      options: [{ allowUnknown: true }],
      errors: [{ messageId: 'weakTypeof' }],
    },
  ],
});
