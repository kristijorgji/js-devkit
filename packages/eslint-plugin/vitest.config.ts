import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    // RuleTester + projectService cold start can exceed Vitest's 5s default.
    testTimeout: 30_000,
  },
});
