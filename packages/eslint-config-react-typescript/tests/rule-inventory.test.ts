import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { createReactConfig } from '../src/index.js';
import { effectiveRules, enabledRuleIds, enabledRulesByPrefix } from './helpers/lint.js';

const viteFixture = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures/vite');
const nextFixture = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures/next');

describe('rule inventory snapshot', () => {
  it('vite variant with storybook false', async () => {
    const config = await createReactConfig({
      variant: 'vite',
      tsconfigRootDir: viteFixture,
      storybook: false,
      prettier: false,
    });
    const rules = await effectiveRules(config, viteFixture, 'Sample.tsx');
    expect(enabledRulesByPrefix(rules)).toMatchSnapshot();
  });

  it('next variant with storybook false', async () => {
    const config = await createReactConfig({
      variant: 'next',
      tsconfigRootDir: nextFixture,
      prettier: false,
    });
    const rules = await effectiveRules(config, nextFixture, 'Sample.tsx');
    expect(enabledRulesByPrefix(rules)).toMatchSnapshot();
  });

  it('storybook true adds only storybook-prefixed rules on *.stories.tsx', async () => {
    const config = await createReactConfig({
      variant: 'vite',
      tsconfigRootDir: viteFixture,
      storybook: true,
      prettier: false,
    });
    const rules = await effectiveRules(config, viteFixture, 'Sample.stories.tsx');
    const storybookIds = enabledRuleIds(rules).filter((id) => id.startsWith('storybook/'));
    expect(storybookIds).toMatchSnapshot();
  });
});
