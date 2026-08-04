import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { createTypescriptConfig } from '../src/index.js';
import { effectiveRules, enabledRulesByPrefix } from './helpers/lint.js';

const fixtureDir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures/base');

describe('rule inventory snapshot', () => {
  it('defaults (codeQuality/explicitTypes off)', async () => {
    const rules = await effectiveRules(
      createTypescriptConfig({ prettier: false }),
      fixtureDir,
      'sample.ts'
    );
    expect(enabledRulesByPrefix(rules)).toMatchSnapshot();
  });

  it('everything on (codeQuality + explicitTypes)', async () => {
    const rules = await effectiveRules(
      createTypescriptConfig({
        prettier: false,
        codeQuality: true,
        explicitTypes: true,
      }),
      fixtureDir,
      'sample.ts'
    );
    expect(enabledRulesByPrefix(rules)).toMatchSnapshot();
  });
});
