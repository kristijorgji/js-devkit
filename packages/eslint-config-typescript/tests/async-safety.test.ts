import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { createTypescriptConfig } from '../src/index.js';
import { effectiveRules, reportedRuleIds, ruleSeverity } from './helpers/lint.js';

const fixtureDir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures/violations');

const typedConfig = createTypescriptConfig({ prettier: false, tsconfigRootDir: fixtureDir });

describe('asyncSafety typed-rule group', () => {
  it('reports no-floating-promises on a discarded promise', async () => {
    expect(await reportedRuleIds(typedConfig, fixtureDir, 'floating-promise-bad.ts')).toContain(
      '@typescript-eslint/no-floating-promises'
    );
  });

  it('reports no-misused-promises when a promise is used as a condition', async () => {
    expect(await reportedRuleIds(typedConfig, fixtureDir, 'misused-promise-bad.ts')).toContain(
      '@typescript-eslint/no-misused-promises'
    );
  });

  it('reports await-thenable when awaiting a non-thenable', async () => {
    expect(await reportedRuleIds(typedConfig, fixtureDir, 'await-thenable-bad.ts')).toContain(
      '@typescript-eslint/await-thenable'
    );
  });

  it('reports switch-exhaustiveness-check when a union member is missing', async () => {
    expect(await reportedRuleIds(typedConfig, fixtureDir, 'switch-exhaustive-bad.ts')).toContain(
      '@typescript-eslint/switch-exhaustiveness-check'
    );
  });

  it('does not report switch-exhaustiveness-check when a default branch is present', async () => {
    expect(await reportedRuleIds(typedConfig, fixtureDir, 'switch-default-ok.ts')).not.toContain(
      '@typescript-eslint/switch-exhaustiveness-check'
    );
  });

  it('asyncSafety false omits all four rules from effectiveRules', async () => {
    const rules = await effectiveRules(
      createTypescriptConfig({
        prettier: false,
        tsconfigRootDir: fixtureDir,
        asyncSafety: false,
      }),
      fixtureDir,
      'floating-promise-bad.ts'
    );
    expect(rules['@typescript-eslint/no-floating-promises']).toBeUndefined();
    expect(rules['@typescript-eslint/no-misused-promises']).toBeUndefined();
    expect(rules['@typescript-eslint/await-thenable']).toBeUndefined();
    expect(rules['@typescript-eslint/switch-exhaustiveness-check']).toBeUndefined();
  });

  it('asyncSafety { floatingPromises: false } drops only that rule', async () => {
    const rules = await effectiveRules(
      createTypescriptConfig({
        prettier: false,
        tsconfigRootDir: fixtureDir,
        asyncSafety: { floatingPromises: false },
      }),
      fixtureDir,
      'floating-promise-bad.ts'
    );
    expect(rules['@typescript-eslint/no-floating-promises']).toBeUndefined();
    expect(ruleSeverity(rules['@typescript-eslint/no-misused-promises'])).toBe(2);
    expect(ruleSeverity(rules['@typescript-eslint/await-thenable'])).toBe(2);
    expect(ruleSeverity(rules['@typescript-eslint/switch-exhaustiveness-check'])).toBe(2);
  });

  it('without tsconfigRootDir none of the four rules is present', async () => {
    const rules = await effectiveRules(
      createTypescriptConfig({ prettier: false }),
      fixtureDir,
      'floating-promise-bad.ts'
    );
    expect(rules['@typescript-eslint/no-floating-promises']).toBeUndefined();
    expect(rules['@typescript-eslint/no-misused-promises']).toBeUndefined();
    expect(rules['@typescript-eslint/await-thenable']).toBeUndefined();
    expect(rules['@typescript-eslint/switch-exhaustiveness-check']).toBeUndefined();
  });

  it('asyncSafety { jsxAttributes: false } sets checksVoidReturn.attributes false', async () => {
    const rules = await effectiveRules(
      createTypescriptConfig({
        prettier: false,
        tsconfigRootDir: fixtureDir,
        asyncSafety: { jsxAttributes: false },
      }),
      fixtureDir,
      'misused-promise-bad.ts'
    );
    const entry = rules['@typescript-eslint/no-misused-promises'];
    expect(Array.isArray(entry)).toBe(true);
    expect(Array.isArray(entry) ? entry[1] : undefined).toEqual({
      checksVoidReturn: { attributes: false },
    });
  });
});
