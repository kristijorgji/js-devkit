import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

import { createTypescriptConfig } from '../src/index.js';

const fixtureDir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures/base');

describe('createTypescriptConfig', () => {
  it('flags pure type aliases via kj/no-pure-type-alias', async () => {
    const eslint = new ESLint({
      cwd: fixtureDir,
      overrideConfigFile: true,
      // Omit tsconfigRootDir — pure-type-alias is not type-aware; avoids projectService cost.
      overrideConfig: createTypescriptConfig({
        files: ['**/*.ts'],
        prettier: false,
      }),
    });

    const results = await eslint.lintText(
      'type Other = { id: string };\ntype Session = Other;\nexport const x: Session = { id: "1" };\n',
      { filePath: path.join(fixtureDir, 'sample.ts') }
    );
    const ruleIds = results.flatMap((r) => r.messages.map((m) => m.ruleId)).filter(Boolean);

    expect(ruleIds).toContain('kj/no-pure-type-alias');
  }, 15_000);

  it('does not enable kj/jsx-leading-prop-order (react factory owns it)', async () => {
    const eslint = new ESLint({
      cwd: fixtureDir,
      overrideConfigFile: true,
      overrideConfig: createTypescriptConfig({ prettier: false }),
    });

    const config = await eslint.calculateConfigForFile(path.join(fixtureDir, 'sample.ts'));
    expect(config.rules?.['kj/jsx-leading-prop-order']).toBeUndefined();
  });
});
