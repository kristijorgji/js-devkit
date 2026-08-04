import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import {
  createImportOrderRules,
  createTypescriptConfig,
  importOrderRules,
} from '../src/index.js';
import { effectiveRules, reportedRuleIdsForText, ruleSeverity } from './helpers/lint.js';

const fixtureDir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures/base');

describe('createTypescriptConfig', () => {
  it('flags pure type aliases via kj/no-pure-type-alias', async () => {
    const overrideConfig = createTypescriptConfig({
      files: ['**/*.ts'],
      prettier: false,
    });

    const ruleIds = await reportedRuleIdsForText(
      overrideConfig,
      fixtureDir,
      'sample.ts',
      'type Other = { id: string };\ntype Session = Other;\nexport const x: Session = { id: "1" };\n'
    );

    expect(ruleIds).toContain('kj/no-pure-type-alias');
  });

  it('does not enable perfectionist/sort-jsx-props (react factory owns it)', async () => {
    const rules = await effectiveRules(
      createTypescriptConfig({ prettier: false }),
      fixtureDir,
      'sample.ts'
    );
    expect(rules['perfectionist/sort-jsx-props']).toBeUndefined();
  });

  it('createImportOrderRules() matches importOrderRules', () => {
    expect(createImportOrderRules()).toEqual(importOrderRules);
  });

  it('passes pathGroups through to import-x/order', async () => {
    const pathGroups = [
      { pattern: 'react', group: 'external', position: 'before' as const },
      { pattern: '@/**', group: 'external', position: 'after' as const },
    ];
    const rules = await effectiveRules(
      createTypescriptConfig({
        prettier: false,
        importOrder: { pathGroups },
      }),
      fixtureDir,
      'sample.ts'
    );
    const entry = rules['import-x/order'];
    const options = Array.isArray(entry) ? entry[1] : undefined;
    expect(options).toMatchObject({ pathGroups });
  });

  it('replaces groups when importOrder.groups is passed', async () => {
    const groups = ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'];
    const rules = await effectiveRules(
      createTypescriptConfig({
        prettier: false,
        importOrder: { groups },
      }),
      fixtureDir,
      'sample.ts'
    );
    const entry = rules['import-x/order'];
    const options = Array.isArray(entry) ? entry[1] : undefined;
    expect(options).toMatchObject({ groups });
  });

  it('sortImports.ignoreCase false is applied', async () => {
    const rules = await effectiveRules(
      createTypescriptConfig({
        prettier: false,
        sortImports: { ignoreCase: false },
      }),
      fixtureDir,
      'sample.ts'
    );
    const entry = rules['sort-imports'];
    const options = Array.isArray(entry) ? entry[1] : undefined;
    expect(options).toMatchObject({ ignoreCase: false, ignoreDeclarationSort: true });
  });

  it('importOrder: false disables import-x/order', async () => {
    const rules = await effectiveRules(
      createTypescriptConfig({
        prettier: false,
        importOrder: false,
      }),
      fixtureDir,
      'sample.ts'
    );
    expect(rules['import-x/order']).toBeUndefined();
    expect(ruleSeverity(rules['import-x/first'])).toBe(2);
  });

  it("prettier: 'prettierrc' emits bare prettier/prettier error", async () => {
    const rules = await effectiveRules(
      createTypescriptConfig({ prettier: 'prettierrc' }),
      fixtureDir,
      'sample.ts'
    );
    expect(rules['prettier/prettier']).toEqual([2]);
  });
});
