import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

import {
  createImportOrderRules,
  createTypescriptConfig,
  importOrderRules,
} from '../src/index.js';

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

  it('does not enable perfectionist/sort-jsx-props (react factory owns it)', async () => {
    const eslint = new ESLint({
      cwd: fixtureDir,
      overrideConfigFile: true,
      overrideConfig: createTypescriptConfig({ prettier: false }),
    });

    const config = await eslint.calculateConfigForFile(path.join(fixtureDir, 'sample.ts'));
    expect(config.rules?.['perfectionist/sort-jsx-props']).toBeUndefined();
  });

  it('createImportOrderRules() matches importOrderRules', () => {
    expect(createImportOrderRules()).toEqual(importOrderRules);
  });

  it('passes pathGroups through to import-x/order', async () => {
    const pathGroups = [
      { pattern: 'react', group: 'external', position: 'before' as const },
      { pattern: '@/**', group: 'external', position: 'after' as const },
    ];
    const eslint = new ESLint({
      cwd: fixtureDir,
      overrideConfigFile: true,
      overrideConfig: createTypescriptConfig({
        prettier: false,
        importOrder: { pathGroups },
      }),
    });

    const config = await eslint.calculateConfigForFile(path.join(fixtureDir, 'sample.ts'));
    const entry = config.rules?.['import-x/order'];
    const options = Array.isArray(entry) ? entry[1] : undefined;
    expect(options).toMatchObject({ pathGroups });
  });

  it('replaces groups when importOrder.groups is passed', async () => {
    const groups = ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'];
    const eslint = new ESLint({
      cwd: fixtureDir,
      overrideConfigFile: true,
      overrideConfig: createTypescriptConfig({
        prettier: false,
        importOrder: { groups },
      }),
    });

    const config = await eslint.calculateConfigForFile(path.join(fixtureDir, 'sample.ts'));
    const entry = config.rules?.['import-x/order'];
    const options = Array.isArray(entry) ? entry[1] : undefined;
    expect(options).toMatchObject({ groups });
  });

  it('sortImports.ignoreCase false is applied', async () => {
    const eslint = new ESLint({
      cwd: fixtureDir,
      overrideConfigFile: true,
      overrideConfig: createTypescriptConfig({
        prettier: false,
        sortImports: { ignoreCase: false },
      }),
    });

    const config = await eslint.calculateConfigForFile(path.join(fixtureDir, 'sample.ts'));
    const entry = config.rules?.['sort-imports'];
    const options = Array.isArray(entry) ? entry[1] : undefined;
    expect(options).toMatchObject({ ignoreCase: false, ignoreDeclarationSort: true });
  });

  it('importOrder: false disables import-x/order', async () => {
    const eslint = new ESLint({
      cwd: fixtureDir,
      overrideConfigFile: true,
      overrideConfig: createTypescriptConfig({
        prettier: false,
        importOrder: false,
      }),
    });

    const config = await eslint.calculateConfigForFile(path.join(fixtureDir, 'sample.ts'));
    expect(config.rules?.['import-x/order']).toBeUndefined();
    expect(config.rules?.['import-x/first']).toBeTruthy();
  });

  it("prettier: 'prettierrc' emits bare prettier/prettier error", async () => {
    const eslint = new ESLint({
      cwd: fixtureDir,
      overrideConfigFile: true,
      overrideConfig: createTypescriptConfig({ prettier: 'prettierrc' }),
    });

    const config = await eslint.calculateConfigForFile(path.join(fixtureDir, 'sample.ts'));
    expect(config.rules?.['prettier/prettier']).toEqual([2]);
  });
});
