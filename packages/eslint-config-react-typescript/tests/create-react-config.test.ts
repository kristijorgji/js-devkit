import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

import { createReactConfig } from '../src/index.js';

const viteFixture = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures/vite');
const nextFixture = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures/next');

describe('createReactConfig', () => {
  it(
    'vite variant enables perfectionist/sort-jsx-props and pure-type-alias',
    async () => {
      const overrideConfig = await createReactConfig({
        variant: 'vite',
        tsconfigRootDir: viteFixture,
        storybook: false,
        prettier: false,
      });

      const eslint = new ESLint({
        cwd: viteFixture,
        overrideConfigFile: true,
        overrideConfig,
      });

      const config = await eslint.calculateConfigForFile(path.join(viteFixture, 'Sample.tsx'));
      expect(config.rules?.['perfectionist/sort-jsx-props']).toBeTruthy();
      expect(config.rules?.['kj/no-pure-type-alias']).toBeTruthy();
    },
    30_000
  );

  it(
    'next variant enables shared kj react rules and JSX prop order',
    async () => {
      const overrideConfig = await createReactConfig({
        variant: 'next',
        tsconfigRootDir: nextFixture,
        prettier: false,
      });

      const eslint = new ESLint({
        cwd: nextFixture,
        overrideConfigFile: true,
        overrideConfig,
      });

      const config = await eslint.calculateConfigForFile(path.join(nextFixture, 'Sample.tsx'));
      expect(config.rules?.['perfectionist/sort-jsx-props']).toBeTruthy();
      expect(config.rules?.['kj/no-multi-comp']).toBeTruthy();
    },
    30_000
  );

  it(
    'jsxProps: false omits perfectionist/sort-jsx-props',
    async () => {
      const overrideConfig = await createReactConfig({
        variant: 'vite',
        tsconfigRootDir: viteFixture,
        storybook: false,
        prettier: false,
        jsxProps: false,
      });

      const eslint = new ESLint({
        cwd: viteFixture,
        overrideConfigFile: true,
        overrideConfig,
      });

      const config = await eslint.calculateConfigForFile(path.join(viteFixture, 'Sample.tsx'));
      expect(config.rules?.['perfectionist/sort-jsx-props']).toBeUndefined();
    },
    30_000
  );

  it(
    'jsxProps.groups replaces the default groups array',
    async () => {
      const overrideConfig = await createReactConfig({
        variant: 'vite',
        tsconfigRootDir: viteFixture,
        storybook: false,
        prettier: false,
        jsxProps: { groups: ['callback', 'unknown'] },
      });

      const eslint = new ESLint({
        cwd: viteFixture,
        overrideConfigFile: true,
        overrideConfig,
      });

      const config = await eslint.calculateConfigForFile(path.join(viteFixture, 'Sample.tsx'));
      const entry = config.rules?.['perfectionist/sort-jsx-props'];
      expect(entry).toBeTruthy();
      const options = Array.isArray(entry) ? entry[1] : undefined;
      expect(options).toMatchObject({ groups: ['callback', 'unknown'] });
    },
    30_000
  );
});
