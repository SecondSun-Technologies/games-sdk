/**
 * @fileoverview Theme Module Public Exports
 * @module @secondsuntech/games-sdk/theme
 *
 * ══════════════════════════════════════════════════════════════════════════════
 * THEME SYSTEM
 *
 * The SDK-owned design system. Games consume tokens, they don't define them.
 *
 * Public exports:
 * - Token types (ThemeTokens, ColorToken, SpacingToken, etc.)
 * - Default themes (LIGHT_THEME, DARK_THEME)
 * - Context (ThemeProvider, useTheme) - for platform use
 * ══════════════════════════════════════════════════════════════════════════════
 */

// Token types
export type {
    ThemeTokens,
    ColorTokens,
    SpacingTokens,
    TypographyTokens,
    RadiusTokens,
    ColorToken,
    SpacingToken,
    TypographyToken,
    RadiusToken,
    ThemeMode,
    Theme,
} from './tokens.js';

// Default themes
export {
    LIGHT_THEME,
    DARK_THEME,
    LIGHT_THEME_TOKENS,
    DARK_THEME_TOKENS,
    getDefaultTheme,
} from './defaults.js';

// Context (primarily for platform/internal use)
export {
    ThemeProvider,
    useTheme,
    useThemeOptional,
    type ThemeProviderProps,
    type ThemeContextValue,
} from './context.js';
