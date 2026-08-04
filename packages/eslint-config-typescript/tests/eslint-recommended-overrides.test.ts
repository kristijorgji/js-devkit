import path from 'node:path';
import { fileURLToPath } from 'node:url';

import tseslint from 'typescript-eslint';
import { describe, expect, it } from 'vitest';

import { createTypescriptConfig } from '../src/index.js';
import { effectiveRules, reportedRuleIdsForText, ruleSeverity } from './helpers/lint.js';

const fixtureDir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures/base');

describe('eslint-recommended overrides in baseRules', () => {
  it('disables every eslint-recommended off rule for TypeScript files', async () => {
    const rules = await effectiveRules(
      createTypescriptConfig({ prettier: false }),
      fixtureDir,
      'sample.ts'
    );

    for (const [ruleId, entry] of Object.entries(tseslint.configs.eslintRecommended.rules ?? {})) {
      if (entry !== 'off') {
        continue;
      }
      // Deliberate kit deviation — see baseRules().
      if (ruleId === 'no-unreachable') {
        continue;
      }
      expect(ruleSeverity(rules[ruleId]), ruleId).toBe(0);
    }
  });

  it('keeps no-var / prefer-const / prefer-rest-params / prefer-spread as errors', async () => {
    const rules = await effectiveRules(
      createTypescriptConfig({ prettier: false }),
      fixtureDir,
      'sample.ts'
    );

    for (const ruleId of ['no-var', 'prefer-const', 'prefer-rest-params', 'prefer-spread']) {
      expect(ruleSeverity(rules[ruleId]), ruleId).toBe(2);
    }
  });

  it('keeps no-unreachable as error (deliberate deviation)', async () => {
    const rules = await effectiveRules(
      createTypescriptConfig({ prettier: false }),
      fixtureDir,
      'sample.ts'
    );
    expect(ruleSeverity(rules['no-unreachable'])).toBe(2);
  });

  it('allows short-circuit / ternary / tagged template unused expressions', async () => {
    const rules = await effectiveRules(
      createTypescriptConfig({ prettier: false }),
      fixtureDir,
      'sample.ts'
    );
    const entry = rules['@typescript-eslint/no-unused-expressions'];
    const options = Array.isArray(entry) ? entry[1] : undefined;
    expect(options).toMatchObject({
      allowShortCircuit: true,
      allowTernary: true,
      allowTaggedTemplates: true,
    });
  });

  it('does not report no-redeclare on function overloads', async () => {
    const ruleIds = await reportedRuleIdsForText(
      createTypescriptConfig({ prettier: false }),
      fixtureDir,
      'sample.ts',
      `
function greet(name: string): string;
function greet(name: number): string;
function greet(name: string | number): string {
  return String(name);
}
export { greet };
`
    );
    expect(ruleIds).not.toContain('no-redeclare');
  });

  it('does not report no-dupe-class-members on method overloads', async () => {
    const ruleIds = await reportedRuleIdsForText(
      createTypescriptConfig({ prettier: false }),
      fixtureDir,
      'sample.ts',
      `
export class Greeter {
  greet(name: string): string;
  greet(name: number): string;
  greet(name: string | number): string {
    return String(name);
  }
}
`
    );
    expect(ruleIds).not.toContain('no-dupe-class-members');
  });

  it('does not report no-undef for ambient React namespace types', async () => {
    const ruleIds = await reportedRuleIdsForText(
      createTypescriptConfig({ prettier: false }),
      fixtureDir,
      'sample.ts',
      `
export type Handler = React.Dispatch<React.SetStateAction<string>>;
`
    );
    expect(ruleIds).not.toContain('no-undef');
  });
});
