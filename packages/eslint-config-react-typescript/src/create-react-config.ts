import {
  createTypescriptConfig,
  defaultExplicitTypesOptions,
  type CreateTypescriptConfigOptions,
  type ExplicitTypesOptions,
} from '@kristijorgji/eslint-config-typescript';
import type { ESLint, Linter } from 'eslint';

import type { SortJsxPropsOptions } from './jsx-props.js';
import { createSharedReactConfigs } from './shared.js';

function isFunctionReturnTypeEnabled(setting?: boolean | ExplicitTypesOptions): boolean {
  if (setting === undefined || setting === false) {
    return false;
  }
  if (setting === true) {
    return defaultExplicitTypesOptions.functionReturnType;
  }
  return setting.functionReturnType ?? defaultExplicitTypesOptions.functionReturnType;
}

export type ReactConfigVariant = 'vite' | 'next';

export interface CreateReactConfigOptions extends CreateTypescriptConfigOptions {
  /** Framework variant. Required. */
  variant: ReactConfigVariant;
  /** Directory containing the consumer's `tsconfig.json`. Required for typed rules. */
  tsconfigRootDir: string;
  /** Include Storybook flat recommended (vite variant). Defaults to false. */
  storybook?: boolean;
  /** Include `eslint-plugin-jsx-a11y` recommended. Defaults to false. */
  a11y?: boolean;
  /** Extra ignores passed to `componentExtraction`. */
  extractionIgnores?: string[];
  /** `false` disables JSX prop sorting; an object shallow-merges over package defaults. */
  jsxProps?: false | SortJsxPropsOptions;
}

type AnyPlugin = ESLint.Plugin;

function asPlugin(mod: unknown): AnyPlugin {
  const resolved = mod as { default?: unknown } | unknown;
  if (resolved && typeof resolved === 'object' && 'default' in resolved && resolved.default) {
    return resolved.default as AnyPlugin;
  }
  return resolved as AnyPlugin;
}

function pluginConfigs(plugin: AnyPlugin): Record<string, unknown> {
  return (plugin.configs ?? {}) as Record<string, unknown>;
}

function rulesFrom(value: unknown): Linter.RulesRecord {
  if (value && typeof value === 'object' && 'rules' in value) {
    return ((value as { rules?: Linter.RulesRecord }).rules ?? {}) as Linter.RulesRecord;
  }
  return {};
}

async function loadVitePlugins(options: {
  storybook?: boolean;
  a11y?: boolean;
}): Promise<Linter.Config[]> {
  const configs: Linter.Config[] = [];

  const reactX = asPlugin(await import('eslint-plugin-react-x'));
  const reactDom = asPlugin(await import('eslint-plugin-react-dom'));
  const reactXConfigs = pluginConfigs(reactX);
  const reactDomConfigs = pluginConfigs(reactDom);

  configs.push({
    files: ['**/*.{ts,tsx}'],
    plugins: {
      'react-x': reactX,
      'react-dom': reactDom,
    },
    rules: {
      ...rulesFrom(reactXConfigs['recommended-typescript']),
      ...rulesFrom(reactDomConfigs.recommended),
    },
  });

  if (options.storybook) {
    const storybook = asPlugin(await import('eslint-plugin-storybook'));
    const flat = pluginConfigs(storybook)['flat/recommended'];
    if (Array.isArray(flat)) {
      configs.push(...(flat as Linter.Config[]));
    }
  }

  if (options.a11y) {
    configs.push(await loadA11yConfig());
  }

  return configs;
}

async function loadNextPlugins(options: { a11y?: boolean }): Promise<Linter.Config[]> {
  const configs: Linter.Config[] = [];

  const react = asPlugin(await import('eslint-plugin-react'));
  const nextPlugin = asPlugin(await import('@next/eslint-plugin-next'));
  const reactConfigs = pluginConfigs(react);
  const flat = (reactConfigs.flat ?? {}) as {
    recommended?: unknown;
    'jsx-runtime'?: unknown;
  };
  const nextConfigs = pluginConfigs(nextPlugin);

  configs.push({
    plugins: { react },
    settings: { react: { version: 'detect' } },
    rules: {
      ...rulesFrom(flat.recommended),
      ...rulesFrom(flat['jsx-runtime']),
      'react/prop-types': 'off',
    },
  });

  configs.push({
    plugins: { '@next/next': nextPlugin },
    rules: {
      ...rulesFrom(nextConfigs.recommended),
      ...rulesFrom(nextConfigs['core-web-vitals']),
    },
  });

  if (options.a11y) {
    configs.push(await loadA11yConfig());
  }

  return configs;
}

async function loadA11yConfig(): Promise<Linter.Config> {
  const jsxA11y = asPlugin(await import('eslint-plugin-jsx-a11y' as string));
  const flatConfigs = (jsxA11y as AnyPlugin & { flatConfigs?: { recommended?: unknown } })
    .flatConfigs;
  return {
    files: ['**/*.{js,mjs,cjs,jsx,mjsx,ts,tsx,mtsx}'],
    plugins: { 'jsx-a11y': jsxA11y },
    rules: { ...rulesFrom(flatConfigs?.recommended) },
  };
}

/**
 * Flat ESLint config factory for React TypeScript apps.
 *
 * Async so framework plugins can be optional peers loaded via dynamic `import()`.
 */
export async function createReactConfig(
  options: CreateReactConfigOptions
): Promise<Linter.Config[]> {
  const {
    variant,
    tsconfigRootDir,
    storybook = false,
    a11y = false,
    extractionIgnores,
    jsxProps,
    ...tsOptions
  } = options;

  const configs: Linter.Config[] = [
    ...createTypescriptConfig({
      ...tsOptions,
      tsconfigRootDir,
    }),
    ...createSharedReactConfigs({ extractionIgnores, jsxProps }),
  ];

  // JSX return types are inferred; keep explicit-function-return-type for .ts only.
  if (isFunctionReturnTypeEnabled(tsOptions.explicitTypes)) {
    configs.push({
      files: ['**/*.{tsx,jsx}'],
      rules: {
        '@typescript-eslint/explicit-function-return-type': 'off',
      },
    });
  }

  if (variant === 'vite') {
    configs.push(...(await loadVitePlugins({ storybook, a11y })));
  } else if (variant === 'next') {
    configs.push(...(await loadNextPlugins({ a11y })));
  } else {
    const _exhaustive: never = variant;
    throw new Error(`Unknown React config variant: ${String(_exhaustive)}`);
  }

  return configs;
}
