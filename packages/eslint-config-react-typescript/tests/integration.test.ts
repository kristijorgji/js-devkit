import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { createReactConfig, type CreateReactConfigOptions } from '../src/index.js';
import {
  effectiveRules,
  fixedSource,
  lintMessages,
  reportedRuleIds,
  reportedRuleIdsForText,
  ruleSeverity,
} from './helpers/lint.js';

const viteFixture = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures/vite');
const nextFixture = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures/next');
const violations = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures/violations');

async function viteConfig(extra: Partial<CreateReactConfigOptions> = {}) {
  return createReactConfig({
    variant: 'vite',
    tsconfigRootDir: violations,
    storybook: false,
    prettier: false,
    ...extra,
  });
}

describe('createReactConfig real-lint wiring', () => {
  it('reports perfectionist/sort-jsx-props and fixes to ranked order', async () => {
    const config = await viteConfig();
    const ruleIds = await reportedRuleIds(config, violations, 'JsxPropsBad.tsx');
    expect(ruleIds).toContain('perfectionist/sort-jsx-props');

    const source = `
export function Button(props: { onClick: () => void; name: string; id: string }): null {
  return null;
}
export function Demo(): null {
  return <Button onClick={() => undefined} name="ok" id="btn" />;
}
`;
    const fixed = await fixedSource(config, violations, 'JsxPropsBad.tsx', source);
    expect(fixed).toContain('id=');
    expect(fixed.indexOf('id=')).toBeLessThan(fixed.indexOf('name='));
    expect(fixed.indexOf('name=')).toBeLessThan(fixed.indexOf('onClick='));
  });

  it('does not reorder across JSX spreads', async () => {
    const config = await viteConfig();
    const source = `
type Props = { id: string; name: string; onClick: () => void };
export function Button(props: Props): null { return null; }
export function Demo(rest: Props): null {
  return <Button onClick={() => undefined} {...rest} name="ok" id="btn" />;
}
`;
    const fixed = await fixedSource(config, violations, 'JsxPropsSpread.tsx', source);
    // Spread segments stay intact — onClick before spread, id/name after.
    expect(fixed).toMatch(/onClick=\{[^}]+\} \{\.\.\.rest\}/);
  });

  it('jsxProps.groups changes fixed output order', async () => {
    const config = await viteConfig({ jsxProps: { groups: ['callback', 'unknown'] } });
    const source = `
export function Button(props: { onClick: () => void; name: string }): null { return null; }
export function Demo(): null {
  return <Button name="ok" onClick={() => undefined} />;
}
`;
    const fixed = await fixedSource(config, violations, 'JsxPropsBad.tsx', source);
    expect(fixed.indexOf('onClick=')).toBeLessThan(fixed.indexOf('name='));
  });

  it('reports kj/no-single-export-barrel', async () => {
    const config = await viteConfig();
    const ruleIds = await reportedRuleIds(config, violations, 'index.ts');
    expect(ruleIds).toContain('kj/no-single-export-barrel');
  });

  it('reports kj/no-multi-comp at warn severity', async () => {
    const config = await viteConfig();
    const messages = await lintMessages(config, violations, 'MultiComp.tsx');
    const hit = messages.find((m) => m.ruleId === 'kj/no-multi-comp');
    expect(hit).toBeTruthy();
    expect(hit?.severity).toBe(1);
  });

  it('extractionIgnores suppresses multi-comp under components/ui', async () => {
    const config = await viteConfig();
    const ruleIds = await reportedRuleIds(config, violations, 'components/ui/Big.tsx');
    expect(ruleIds).not.toContain('kj/no-multi-comp');
  });

  it('wires react-hooks rules', async () => {
    const config = await viteConfig();
    const ruleIds = await reportedRuleIds(config, violations, 'HooksBad.tsx');
    expect(ruleIds.some((id) => id?.startsWith('react-hooks/'))).toBe(true);
  });

  it('wires react-refresh/only-export-components', async () => {
    const config = await viteConfig();
    const ruleIds = await reportedRuleIds(config, violations, 'RefreshBad.tsx');
    expect(ruleIds).toContain('react-refresh/only-export-components');
  });

  it('does not report no-undef for React.Dispatch on tsx', async () => {
    const config = await viteConfig();
    const ruleIds = await reportedRuleIdsForText(
      config,
      violations,
      'Ambient.tsx',
      'export type Handler = React.Dispatch<React.SetStateAction<string>>;\n'
    );
    expect(ruleIds).not.toContain('no-undef');
  });

  it('storybook true adds storybook rules on *.stories.tsx; false does not', async () => {
    const withSb = await createReactConfig({
      variant: 'vite',
      tsconfigRootDir: viteFixture,
      storybook: true,
      prettier: false,
    });
    const withoutSb = await createReactConfig({
      variant: 'vite',
      tsconfigRootDir: viteFixture,
      storybook: false,
      prettier: false,
    });

    const withRules = await effectiveRules(withSb, viteFixture, 'Sample.stories.tsx');
    const withoutRules = await effectiveRules(withoutSb, viteFixture, 'Sample.stories.tsx');
    const withStorybook = Object.keys(withRules).some((id) => id.startsWith('storybook/'));
    const withoutStorybook = Object.keys(withoutRules).some((id) => id.startsWith('storybook/'));
    expect(withStorybook).toBe(true);
    expect(withoutStorybook).toBe(false);
  });

  it('next and vite variants both resolve dynamic plugins', async () => {
    const vite = await createReactConfig({
      variant: 'vite',
      tsconfigRootDir: viteFixture,
      storybook: false,
      prettier: false,
    });
    const next = await createReactConfig({
      variant: 'next',
      tsconfigRootDir: nextFixture,
      prettier: false,
    });

    const viteRules = await effectiveRules(vite, viteFixture, 'Sample.tsx');
    const nextRules = await effectiveRules(next, nextFixture, 'Sample.tsx');
    expect(ruleSeverity(viteRules['perfectionist/sort-jsx-props'])).toBe(2);
    expect(ruleSeverity(nextRules['perfectionist/sort-jsx-props'])).toBe(2);
  });
});
