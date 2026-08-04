import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import {
  consistentTypeAssertionsOptions,
  consistentTypeImportsOptions,
  createTypescriptConfig,
  explicitFunctionReturnTypeOptions,
  explicitTypesRules,
} from '../src/index.js';
import { effectiveRules, reportedRuleIds, ruleSeverity } from './helpers/lint.js';

const fixtureDir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures/violations');

/** Stable option objects for the explicitTypes group. */
const explicitTypesOptionObjects = {
  consistentTypeAssertions: consistentTypeAssertionsOptions,
  consistentTypeImports: consistentTypeImportsOptions,
  explicitFunctionReturnType: explicitFunctionReturnTypeOptions,
};

describe('codeQuality and explicitTypes option groups', () => {
  it('omitting codeQuality leaves sonarjs and unused-imports rules absent', async () => {
    const rules = await effectiveRules(
      createTypescriptConfig({ prettier: false }),
      fixtureDir,
      'unused-import-bad.ts'
    );
    expect(rules['sonarjs/no-identical-functions']).toBeUndefined();
    expect(rules['unused-imports/no-unused-imports']).toBeUndefined();
    expect(rules['@typescript-eslint/no-unused-private-class-members']).toBeUndefined();
  });

  it('codeQuality true reports duplication and unused-symbol rules', async () => {
    const config = createTypescriptConfig({ prettier: false, codeQuality: true });

    expect(
      await reportedRuleIds(config, fixtureDir, 'sonar-identical-functions.ts')
    ).toContain('sonarjs/no-identical-functions');
    expect(await reportedRuleIds(config, fixtureDir, 'unused-import-bad.ts')).toContain(
      'unused-imports/no-unused-imports'
    );
    expect(await reportedRuleIds(config, fixtureDir, 'unused-private-bad.ts')).toContain(
      '@typescript-eslint/no-unused-private-class-members'
    );
  });

  it('codeQuality duplication false keeps unused-symbol rules only', async () => {
    const rules = await effectiveRules(
      createTypescriptConfig({
        prettier: false,
        codeQuality: { duplication: false },
      }),
      fixtureDir,
      'unused-import-bad.ts'
    );
    expect(rules['sonarjs/no-identical-functions']).toBeUndefined();
    expect(ruleSeverity(rules['unused-imports/no-unused-imports'])).toBe(2);
  });

  it('omitting explicitTypes leaves typing rules absent', async () => {
    const rules = await effectiveRules(
      createTypescriptConfig({ prettier: false }),
      fixtureDir,
      'type-assertion-bad.ts'
    );
    expect(rules['@typescript-eslint/consistent-type-assertions']).toBeUndefined();
    expect(rules['@typescript-eslint/consistent-type-imports']).toBeUndefined();
    expect(rules['@typescript-eslint/explicit-module-boundary-types']).toBeUndefined();
    expect(rules['@typescript-eslint/explicit-function-return-type']).toBeUndefined();
  });

  it('explicitTypes true reports each typing rule', async () => {
    const config = createTypescriptConfig({ prettier: false, explicitTypes: true });

    expect(await reportedRuleIds(config, fixtureDir, 'type-assertion-bad.ts')).toContain(
      '@typescript-eslint/consistent-type-assertions'
    );
    expect(await reportedRuleIds(config, fixtureDir, 'type-import-bad.ts')).toContain(
      '@typescript-eslint/consistent-type-imports'
    );
    expect(await reportedRuleIds(config, fixtureDir, 'boundary-types-bad.ts')).toContain(
      '@typescript-eslint/explicit-module-boundary-types'
    );
    expect(await reportedRuleIds(config, fixtureDir, 'return-type-bad.ts')).toContain(
      '@typescript-eslint/explicit-function-return-type'
    );
  });

  it('explicitTypes functionReturnType false drops only that rule', async () => {
    const rules = await effectiveRules(
      createTypescriptConfig({
        prettier: false,
        explicitTypes: { functionReturnType: false },
      }),
      fixtureDir,
      'return-type-bad.ts'
    );
    expect(rules['@typescript-eslint/explicit-function-return-type']).toBeUndefined();
    expect(ruleSeverity(rules['@typescript-eslint/explicit-module-boundary-types'])).toBe(2);
  });

  it('emitted option objects match the explicitTypes option-object snapshot', () => {
    const rules = explicitTypesRules(true);
    expect(rules['@typescript-eslint/consistent-type-assertions']).toEqual([
      'error',
      explicitTypesOptionObjects.consistentTypeAssertions,
    ]);
    expect(rules['@typescript-eslint/consistent-type-imports']).toEqual([
      'error',
      explicitTypesOptionObjects.consistentTypeImports,
    ]);
    expect(rules['@typescript-eslint/explicit-function-return-type']).toEqual([
      'error',
      explicitTypesOptionObjects.explicitFunctionReturnType,
    ]);
    expect(rules['@typescript-eslint/explicit-module-boundary-types']).toBe('error');
  });
});
