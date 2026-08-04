import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { createReactConfig } from '../src/index.js';
import { effectiveRules, ruleSeverity } from './helpers/lint.js';

const viteFixture = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures/vite');
const nextFixture = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures/next');

describe('createReactConfig', () => {
  it('vite variant enables perfectionist/sort-jsx-props and pure-type-alias', async () => {
    const overrideConfig = await createReactConfig({
      variant: 'vite',
      tsconfigRootDir: viteFixture,
      storybook: false,
      prettier: false,
    });

    const rules = await effectiveRules(overrideConfig, viteFixture, 'Sample.tsx');
    expect(ruleSeverity(rules['perfectionist/sort-jsx-props'])).toBe(2);
    expect(ruleSeverity(rules['kj/no-pure-type-alias'])).toBe(2);
  });

  it('next variant enables shared kj react rules and JSX prop order', async () => {
    const overrideConfig = await createReactConfig({
      variant: 'next',
      tsconfigRootDir: nextFixture,
      prettier: false,
    });

    const rules = await effectiveRules(overrideConfig, nextFixture, 'Sample.tsx');
    expect(ruleSeverity(rules['perfectionist/sort-jsx-props'])).toBe(2);
    expect(ruleSeverity(rules['kj/no-multi-comp'])).toBe(1);
  });

  it('jsxProps: false omits perfectionist/sort-jsx-props', async () => {
    const overrideConfig = await createReactConfig({
      variant: 'vite',
      tsconfigRootDir: viteFixture,
      storybook: false,
      prettier: false,
      jsxProps: false,
    });

    const rules = await effectiveRules(overrideConfig, viteFixture, 'Sample.tsx');
    expect(rules['perfectionist/sort-jsx-props']).toBeUndefined();
  });

  it('jsxProps.groups replaces the default groups array', async () => {
    const overrideConfig = await createReactConfig({
      variant: 'vite',
      tsconfigRootDir: viteFixture,
      storybook: false,
      prettier: false,
      jsxProps: { groups: ['callback', 'unknown'] },
    });

    const rules = await effectiveRules(overrideConfig, viteFixture, 'Sample.tsx');
    const entry = rules['perfectionist/sort-jsx-props'];
    expect(entry).toBeTruthy();
    const options = Array.isArray(entry) ? entry[1] : undefined;
    expect(options).toMatchObject({ groups: ['callback', 'unknown'] });
  });

  it('throws on unknown variant', async () => {
    await expect(
      createReactConfig({
        // @ts-expect-error intentional invalid variant
        variant: 'svelte',
        tsconfigRootDir: viteFixture,
        prettier: false,
      })
    ).rejects.toThrow(/Unknown React config variant/);
  });
});
