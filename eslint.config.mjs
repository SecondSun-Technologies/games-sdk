// @ts-check
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';

/**
 * ESLint Configuration for Games SDK
 * 
 * ESLint is LAW, not suggestion. These rules prevent:
 * - Silent async bugs
 * - any leakage
 * - Fake exhaustiveness
 * - Unhandled promises
 * - Games bypassing the rendering jail
 */
export default tseslint.config(
    eslint.configs.recommended,
    ...tseslint.configs.strictTypeChecked,
    ...tseslint.configs.stylisticTypeChecked,
    {
        plugins: {
            'react': reactPlugin,
        },
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

            // ═══════════════════════════════════════════════════════════════════
            // RENDERING JAIL - DOM / RN / CSS / CANVAS ARE BANNED
            // Games may ONLY render using SDK primitives from @secondsuntech/games-sdk/ui
            // This is not optional. This is law.
            // ═══════════════════════════════════════════════════════════════════
            'no-restricted-imports': [
                'error',
                {
                    paths: [
                        // React DOM is platform code only
                        {
                            name: 'react-dom',
                            message: '❌ Games cannot import react-dom. Use SDK primitives from @secondsuntech/games-sdk/ui'
                        },
                        {
                            name: 'react-dom/client',
                            message: '❌ Games cannot import react-dom. Rendering is platform-owned.'
                        },
                        // React Native is platform code only
                        {
                            name: 'react-native',
                            message: '❌ Games cannot import react-native. Use SDK primitives from @secondsuntech/games-sdk/ui'
                        },
                        // CSS modules are forbidden
                        {
                            name: 'styled-components',
                            message: '❌ CSS-in-JS is forbidden. Use SDK theme tokens via useTheme()'
                        },
                        {
                            name: '@emotion/react',
                            message: '❌ CSS-in-JS is forbidden. Use SDK theme tokens via useTheme()'
                        },
                        {
                            name: '@emotion/styled',
                            message: '❌ CSS-in-JS is forbidden. Use SDK theme tokens via useTheme()'
                        },
                    ],
                    patterns: [
                        // Block all react-native subpaths
                        {
                            group: ['react-native/*', 'react-native-*'],
                            message: '❌ React Native imports are forbidden. Use SDK primitives.'
                        },
                        // Block CSS modules
                        {
                            group: ['*.css', '*.scss', '*.sass', '*.less'],
                            message: '❌ CSS imports are forbidden. Use SDK theme system.'
                        },
                    ]
                }
            ],
            // Ban raw HTML intrinsic elements - games must use primitives
            'react/forbid-elements': [
                'error',
                {
                    forbid: [
                        { element: 'div', message: '❌ Use <View> from @secondsuntech/games-sdk/ui' },
                        { element: 'span', message: '❌ Use <Text> from @secondsuntech/games-sdk/ui' },
                        { element: 'p', message: '❌ Use <Text> from @secondsuntech/games-sdk/ui' },
                        { element: 'button', message: '❌ Use <Button> from @secondsuntech/games-sdk/ui' },
                        { element: 'input', message: '❌ Use SDK form primitives (coming soon)' },
                        { element: 'img', message: '❌ Use SDK Image primitive (coming soon)' },
                        { element: 'canvas', message: '❌ Canvas is forbidden. Games render via SDK primitives only.' },
                        { element: 'svg', message: '❌ SVG is forbidden. Use SDK Icon primitive (coming soon)' },
                        { element: 'a', message: '❌ Links are platform-owned. Emit events instead.' },
                        { element: 'form', message: '❌ Forms are forbidden. Use SDK primitives.' },
                        { element: 'h1', message: '❌ Use <Text variant="heading"> from @secondsuntech/games-sdk/ui' },
                        { element: 'h2', message: '❌ Use <Text variant="heading"> from @secondsuntech/games-sdk/ui' },
                        { element: 'h3', message: '❌ Use <Text variant="heading"> from @secondsuntech/games-sdk/ui' },
                        { element: 'ul', message: '❌ Use <Stack> from @secondsuntech/games-sdk/ui' },
                        { element: 'ol', message: '❌ Use <Stack> from @secondsuntech/games-sdk/ui' },
                        { element: 'li', message: '❌ Use <View> inside <Stack> from @secondsuntech/games-sdk/ui' },
                    ]
                }
            ],
        },
    },
    // ═══════════════════════════════════════════════════════════════════════════
    // PLATFORM CODE EXEMPTIONS
    // Platform code (SDK internals) CAN use DOM/RN - games cannot.
    // ═══════════════════════════════════════════════════════════════════════════
    {
        files: ['src/platform/**/*', 'src/ui/primitives/**/*', 'src/theme/**/*'],
        rules: {
            // Platform code renders TO DOM, so it needs DOM elements
            'react/forbid-elements': 'off',
            // Platform code imports react-dom for renderGame
            'no-restricted-imports': 'off',
        },
    },
    {
        // Relax rules for test files
        files: ['**/*.test.ts', '**/*.test.tsx'],
        rules: {
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-unsafe-assignment': 'off',
            '@typescript-eslint/no-non-null-assertion': 'off',
            'react/forbid-elements': 'off',
            'no-restricted-imports': 'off',
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
        ignores: [
            'dist/',
            'node_modules/',
            '*.config.*',
            // Native files excluded from web tsconfig - will lint in RN environment
            '**/*.native.ts',
            '**/*.native.tsx',
            '**/native/**',
            // Test files excluded from web tsconfig - handled by vitest
            '**/*.test.ts',
            '**/*.test.tsx',
            '**/__tests__/**',
        ],
    }
);
