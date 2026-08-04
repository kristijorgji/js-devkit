import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { createTypescriptConfig } from '../src/index.js';
import { reportedRuleIds, reportedRuleIdsForText } from './helpers/lint.js';

const fixtureDir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures/violations');

describe('createTypescriptConfig real-lint wiring', () => {
  it('reports import-x/order on unsorted builtin imports', async () => {
    const ruleIds = await reportedRuleIds(
      createTypescriptConfig({ prettier: false }),
      fixtureDir,
      'import-order-bad.ts'
    );
    expect(ruleIds).toContain('import-x/order');
  });

  it('reports import-x/first when imports are not first', async () => {
    const ruleIds = await reportedRuleIds(
      createTypescriptConfig({ prettier: false }),
      fixtureDir,
      'import-first-bad.ts'
    );
    expect(ruleIds).toContain('import-x/first');
  });

  it('reports import-x/no-duplicates', async () => {
    const ruleIds = await reportedRuleIds(
      createTypescriptConfig({ prettier: false }),
      fixtureDir,
      'import-duplicates-bad.ts'
    );
    expect(ruleIds).toContain('import-x/no-duplicates');
  });

  it('sortImports ignoreCase false reports case-sensitive member sort', async () => {
    const withCase = await reportedRuleIds(
      createTypescriptConfig({
        prettier: false,
        sortImports: { ignoreCase: false },
      }),
      fixtureDir,
      'sort-imports-case.ts'
    );
    expect(withCase).toContain('sort-imports');

    const ignoreCase = await reportedRuleIds(
      createTypescriptConfig({ prettier: false }),
      fixtureDir,
      'sort-imports-case.ts'
    );
    expect(ignoreCase).not.toContain('sort-imports');
  });

  it('reports @typescript-eslint/no-explicit-any', async () => {
    const ruleIds = await reportedRuleIds(
      createTypescriptConfig({ prettier: false }),
      fixtureDir,
      'any-bad.ts'
    );
    expect(ruleIds).toContain('@typescript-eslint/no-explicit-any');
  });

  it('reports unused vars but not _-prefixed ones', async () => {
    const ruleIds = await reportedRuleIds(
      createTypescriptConfig({ prettier: false }),
      fixtureDir,
      'unused-vars-bad.ts'
    );
    expect(ruleIds).toContain('@typescript-eslint/no-unused-vars');
  });

  it('prettier true embeds arrowParens avoid and flags parenthesized single arg', async () => {
    const ruleIds = await reportedRuleIds(
      createTypescriptConfig({ prettier: true }),
      fixtureDir,
      'prettier-arrow.ts'
    );
    expect(ruleIds).toContain('prettier/prettier');
  });

  it("prettier 'prettierrc' respects fixture .prettierrc arrowParens always", async () => {
    // Same source is valid under arrowParens: 'always' — proves kit defaults are not embedded.
    const ruleIds = await reportedRuleIds(
      createTypescriptConfig({ prettier: 'prettierrc' }),
      fixtureDir,
      'prettier-arrow.ts'
    );
    expect(ruleIds).not.toContain('prettier/prettier');
  });

  it('reports kj/no-weak-typeof-satisfies when tsconfigRootDir is set', async () => {
    const ruleIds = await reportedRuleIds(
      createTypescriptConfig({
        prettier: false,
        tsconfigRootDir: fixtureDir,
      }),
      fixtureDir,
      'weak-typeof-bad.ts'
    );
    expect(ruleIds).toContain('kj/no-weak-typeof-satisfies');
  });

  it('does not enable weak-typeof without tsconfigRootDir', async () => {
    const ruleIds = await reportedRuleIdsForText(
      createTypescriptConfig({ prettier: false }),
      fixtureDir,
      'weak-typeof-bad.ts',
      'type Session = { id: string };\nconst value = { id: "1" };\nexport const session = value as typeof value satisfies Session;\n'
    );
    expect(ruleIds).not.toContain('kj/no-weak-typeof-satisfies');
  });
});
