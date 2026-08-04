import tseslint from 'typescript-eslint';

/** Bootstrap self-lint. Once packages are built, consumers should prefer @kristijorgji/eslint-plugin. */
export default tseslint.config(
    {
        ignores: [
            '**/dist/**',
            '**/coverage/**',
            '**/node_modules/**',
            '**/*.tgz',
            '**/tests/fixtures/**',
        ],
    },
    ...tseslint.configs.recommended,
    {
        files: ['**/*.{ts,tsx,js,mjs,cjs}'],
        languageOptions: {
            parserOptions: {
                ecmaVersion: 2022,
                sourceType: 'module',
            },
        },
        rules: {
            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                    caughtErrorsIgnorePattern: '^_',
                },
            ],
        },
    },
);
