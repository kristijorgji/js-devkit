import type { Linter } from 'eslint';

/** Default ignore patterns for TypeScript projects. */
export const ignores: Linter.Config = {
  ignores: [
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
    '**/coverage/**',
    '**/.next/**',
    '**/storybook-static/**',
  ],
};
