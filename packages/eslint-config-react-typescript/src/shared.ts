import { componentExtraction, plugin as kjPlugin } from '@kristijorgji/eslint-plugin';
import type { Linter } from 'eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

/** Shared React core: hooks, refresh, kj JSX/barrel/extraction rules. */
export function createSharedReactConfigs(options?: {
  extractionIgnores?: string[];
}): Linter.Config[] {
  const extractionIgnores = options?.extractionIgnores ?? [
    '**/components/ui/**',
    '**/*.test.tsx',
    '**/*.stories.tsx',
    '**/*.test.ts',
    '**/*.stories.ts',
  ];

  return [
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
        'kj/jsx-leading-prop-order': 'error',
        'kj/no-single-export-barrel': 'error',
      },
    },
    ...componentExtraction({
      ignores: extractionIgnores,
    }),
  ];
}
