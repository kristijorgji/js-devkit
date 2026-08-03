import { componentExtraction, plugin as kjPlugin } from '@kristijorgji/eslint-plugin';
import type { Linter } from 'eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';

import { createJsxPropsConfig, type SortJsxPropsOptions } from './jsx-props.js';

/** Shared React core: hooks, refresh, kj barrel/extraction rules, browser globals, JSX prop order. */
export function createSharedReactConfigs(options?: {
  extractionIgnores?: string[];
  /** `false` disables JSX prop sorting; an object shallow-merges over package defaults. */
  jsxProps?: false | SortJsxPropsOptions;
}): Linter.Config[] {
  const extractionIgnores = options?.extractionIgnores ?? [
    '**/components/ui/**',
    '**/*.test.tsx',
    '**/*.stories.tsx',
    '**/*.test.ts',
    '**/*.stories.ts',
  ];

  const configs: Linter.Config[] = [
    {
      files: ['**/*.{ts,tsx}'],
      languageOptions: {
        globals: {
          ...globals.browser,
        },
      },
    },
    {
      plugins: {
        'react-hooks': reactHooks,
        'react-refresh': reactRefresh,
      },
      rules: {
        ...reactHooks.configs.recommended.rules,
        'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      },
    },
    {
      files: ['**/*.{ts,tsx}'],
      plugins: { kj: kjPlugin },
      rules: {
        'kj/no-single-export-barrel': 'error',
      },
    },
    ...componentExtraction({
      ignores: extractionIgnores,
    }),
  ];

  if (options?.jsxProps !== false) {
    configs.push(createJsxPropsConfig(options?.jsxProps));
  }

  return configs;
}
