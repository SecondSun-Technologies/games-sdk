// @ts-check
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

/**
 * ESLint Configuration for Games SDK
 * 
 * ESLint is LAW, not suggestion. These rules prevent:
 * - Silent async bugs
 * - any leakage
 * - Fake exhaustiveness
 * - Unhandled promises
 */
export default tseslint.config(
    eslint.configs.recommended,
    ...tseslint.configs.strictTypeChecked,
    ...tseslint.configs.stylisticTypeChecked,
    {
        languageOptions: {
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
        rules: {
            // ═══════════════════════════════════════════════════════════════════
            // ANY IS FORBIDDEN
            // any is a hole in the hull. unknown is a locked door.
            // ═══════════════════════════════════════════════════════════════════
            '@typescript-eslint/no-explicit-any': 'error',
            '@typescript-eslint/no-unsafe-assignment': 'error',
            '@typescript-eslint/no-unsafe-member-access': 'error',
            '@typescript-eslint/no-unsafe-call': 'error',
            '@typescript-eslint/no-unsafe-return': 'error',
            '@typescript-eslint/no-unsafe-argument': 'error',

            // ═══════════════════════════════════════════════════════════════════
            // VOID EXPRESSION SAFETY
            // Pairs with fire-and-forget event emitter - prevents accidentally
            // returning void from expressions, especially in JSX and callbacks
            // ═══════════════════════════════════════════════════════════════════
            '@typescript-eslint/no-confusing-void-expression': 'error',

            // ═══════════════════════════════════════════════════════════════════
            // TYPE HYGIENE
            // Prevents unions like string | string, catches accidental widening
            // Keeps event payload types tight as vocabulary grows
            // ═══════════════════════════════════════════════════════════════════
            '@typescript-eslint/no-redundant-type-constituents': 'error',

            // ═══════════════════════════════════════════════════════════════════
            // EXHAUSTIVE SWITCHES
            // Discriminated unions only work if you handle every case
            // ═══════════════════════════════════════════════════════════════════
            '@typescript-eslint/switch-exhaustiveness-check': 'error',

            // ═══════════════════════════════════════════════════════════════════
            // ASYNC SAFETY
            // Async bugs are the JS equivalent of use-after-free
            // ═══════════════════════════════════════════════════════════════════
            '@typescript-eslint/no-floating-promises': 'error',
            '@typescript-eslint/no-misused-promises': 'error',
            '@typescript-eslint/require-await': 'error',
            '@typescript-eslint/await-thenable': 'error',
            '@typescript-eslint/promise-function-async': 'error',

            // ═══════════════════════════════════════════════════════════════════
            // TYPE IMPORTS
            // Consistent imports make refactoring safer
            // ═══════════════════════════════════════════════════════════════════
            '@typescript-eslint/consistent-type-imports': [
                'error',
                { prefer: 'type-imports', fixStyle: 'inline-type-imports' }
            ],
            '@typescript-eslint/consistent-type-exports': 'error',

            // ═══════════════════════════════════════════════════════════════════
            // UNUSED CODE
            // Dead code is a liability
            // ═══════════════════════════════════════════════════════════════════
            '@typescript-eslint/no-unused-vars': [
                'error',
                { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
            ],

            // ═══════════════════════════════════════════════════════════════════
            // NULL SAFETY
            // Be explicit about null handling
            // ═══════════════════════════════════════════════════════════════════
            '@typescript-eslint/no-unnecessary-condition': 'error',
            '@typescript-eslint/prefer-nullish-coalescing': 'error',
            '@typescript-eslint/strict-boolean-expressions': 'error',

            // ═══════════════════════════════════════════════════════════════════
            // GENERAL SAFETY
            // ═══════════════════════════════════════════════════════════════════
            '@typescript-eslint/no-non-null-assertion': 'error',
            '@typescript-eslint/prefer-readonly': 'error',
            '@typescript-eslint/explicit-function-return-type': [
                'error',
                { allowExpressions: true }
            ],
            '@typescript-eslint/explicit-module-boundary-types': 'error',
            'no-console': ['warn', { allow: ['warn', 'error'] }],
            'eqeqeq': ['error', 'always'],
            'no-var': 'error',
            'prefer-const': 'error',
        },
    },
    {
        // Relax rules for test files
        files: ['**/*.test.ts', '**/*.test.tsx'],
        rules: {
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-unsafe-assignment': 'off',
            '@typescript-eslint/no-non-null-assertion': 'off',
        },
    },
    {
        // Relax rules for dev tooling (but only slightly)
        files: ['src/dev/**/*'],
        rules: {
            'no-console': 'off', // Dev tools need console
        },
    },
    {
        ignores: ['dist/', 'node_modules/', '*.config.*'],
    }
);
